import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate authentication based on webhook config
function validateAuthentication(
  req: Request,
  webhookConfig: any
): { valid: boolean; error?: string } {
  const authType = webhookConfig.authentication || "none";

  if (authType === "none") {
    return { valid: true };
  }

  const authCredentials = webhookConfig.authCredentials || {};

  if (authType === "basic") {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return { valid: false, error: "Basic authentication required" };
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(":");

    if (
      username !== authCredentials.username ||
      password !== authCredentials.password
    ) {
      return { valid: false, error: "Invalid credentials" };
    }

    return { valid: true };
  }

  if (authType === "header") {
    const headerName = authCredentials.headerName;
    const headerValue = authCredentials.headerValue;

    if (!headerName || !headerValue) {
      return { valid: true }; // No header configured, skip validation
    }

    const providedValue = req.headers.get(headerName);
    if (providedValue !== headerValue) {
      return { valid: false, error: `Invalid ${headerName} header` };
    }

    return { valid: true };
  }

  return { valid: true };
}

// Replace {{variableName}} with their values
const replaceVariables = (text: string, vars: Record<string, string>): string => {
  return text.replace(/{{\s*([^}]+?)\s*}}/g, (_, varName) => {
    return vars[varName.trim()] ?? "";
  });
};

// Evaluate comparison operators
const evaluateComparison = (varValue: string, operator: string, compareValue: string): boolean => {
  const normalizedVar = (varValue ?? "").toString().trim();
  const normalizedCompare = (compareValue ?? "").toString().trim();

  switch (operator) {
    case "equals":
      return normalizedVar === normalizedCompare;
    case "not_equals":
      return normalizedVar !== normalizedCompare;
    case "contains":
      return normalizedVar.includes(normalizedCompare);
    case "not_contains":
      return !normalizedVar.includes(normalizedCompare);
    case "greater_than":
      return Number(normalizedVar) > Number(normalizedCompare);
    case "less_than":
      return Number(normalizedVar) < Number(normalizedCompare);
    case "is_set":
      return normalizedVar !== "";
    case "is_empty":
      return normalizedVar === "";
    case "starts_with":
      return normalizedVar.startsWith(normalizedCompare);
    case "ends_with":
      return normalizedVar.endsWith(normalizedCompare);
    default:
      return false;
  }
};

interface SessionState {
  messages: Array<{ id: string; type: "bot" | "user"; content: string }>;
  variables: Record<string, string>;
  currentContainerId: string | null;
  currentNodeIndex: number;
  waitingFor: string | null;
  waitingNodeId: string | null;
}

// Process flow from webhook node
async function processFlowFromWebhook(
  containers: any[],
  edges: any[],
  webhookNode: any,
  webhookContainerId: string,
  webhookNodeIndex: number,
  webhookPayload: any,
  supabase: any
): Promise<{ state: SessionState; result: any }> {
  const state: SessionState = {
    messages: [],
    variables: {},
    currentContainerId: webhookContainerId,
    currentNodeIndex: webhookNodeIndex,
    waitingFor: null,
    waitingNodeId: null,
  };

  // Set webhook data as variable
  const responseVariable = webhookNode.config.responseVariable || "webhookData";
  state.variables[responseVariable] = JSON.stringify(webhookPayload);

  // Also set individual payload fields as variables
  if (typeof webhookPayload === "object" && webhookPayload !== null) {
    Object.entries(webhookPayload).forEach(([key, value]) => {
      state.variables[key] = typeof value === "string" ? value : JSON.stringify(value);
    });
  }

  // Move to next node after webhook
  state.currentNodeIndex++;

  // Process remaining nodes
  const maxIterations = 100;
  let iterations = 0;
  const collectedData: Record<string, any> = { ...state.variables };

  while (iterations < maxIterations) {
    iterations++;

    const container = containers.find((c: any) => c.id === state.currentContainerId);
    if (!container || state.currentNodeIndex >= container.nodes.length) {
      // Find next container via edge
      const nextEdge = edges.find((edge: any) => edge.source === container?.id);
      if (nextEdge) {
        const nextContainer = containers.find((c: any) => c.id === nextEdge.target);
        if (nextContainer) {
          state.currentContainerId = nextContainer.id;
          state.currentNodeIndex = 0;
          continue;
        }
      }
      break;
    }

    const node = container.nodes[state.currentNodeIndex];

    switch (node.type) {
      case "set-variable": {
        const variableName = node.config.variableName;
        const valueType = node.config.valueType || "custom";
        let value = "";

        switch (valueType) {
          case "empty":
            value = "";
            break;
          case "now":
            value = new Date().toISOString();
            break;
          case "today":
            value = new Date().toISOString().split("T")[0];
            break;
          case "custom":
          default:
            value = replaceVariables(node.config.customValue || node.config.value || "", state.variables);
        }

        if (variableName) {
          state.variables[variableName] = value;
          collectedData[variableName] = value;
        }
        state.currentNodeIndex++;
        break;
      }

      case "condition": {
        const conditionGroups = (node.config.conditions || []) as Array<{
          id: string;
          comparisons: Array<{ variableName: string; operator: string; value?: string }>;
          logicalOperator?: "AND" | "OR";
        }>;

        let matchedConditionId: string | null = null;

        for (const group of conditionGroups) {
          const comparisons = group.comparisons || [];
          if (comparisons.length === 0) continue;

          const logicOperator = group.logicalOperator || "AND";
          let groupResult = logicOperator === "AND" ? true : false;

          for (const comparison of comparisons) {
            const varName = (comparison.variableName || "").trim().replace(/^{{\s*/, "").replace(/\s*}}$/, "");
            const varValue = state.variables[varName] ?? "";
            const compareValue = replaceVariables(comparison.value || "", state.variables);
            const comparisonResult = evaluateComparison(varValue, comparison.operator, compareValue);

            if (logicOperator === "AND") {
              groupResult = groupResult && comparisonResult;
            } else {
              groupResult = groupResult || comparisonResult;
            }
          }

          if (groupResult) {
            matchedConditionId = group.id;
            break;
          }
        }

        const targetEdge = matchedConditionId
          ? edges.find((e: any) => e.sourceHandle === `${node.id}-cond-${matchedConditionId}`)
          : edges.find((e: any) => e.sourceHandle === `${node.id}-else`);

        if (targetEdge) {
          const targetContainer = containers.find((c: any) => c.id === targetEdge.target);
          if (targetContainer) {
            state.currentContainerId = targetContainer.id;
            state.currentNodeIndex = 0;
            continue;
          }
        }
        state.currentNodeIndex++;
        break;
      }

      case "http-request": {
        const { method = "GET", url, responseVariable = "httpResponse", body } = node.config;
        const processedUrl = replaceVariables(url || "", state.variables);

        if (processedUrl) {
          try {
            const fetchOptions: RequestInit = {
              method,
              headers: { "Content-Type": "application/json" },
            };

            if (body && ["POST", "PUT", "PATCH"].includes(method)) {
              fetchOptions.body = replaceVariables(body, state.variables);
            }

            const response = await fetch(processedUrl, fetchOptions);
            const text = await response.text();
            let data = text;
            try { data = JSON.stringify(JSON.parse(text)); } catch {}

            state.variables[responseVariable] = data;
            collectedData[responseVariable] = data;
          } catch (error: any) {
            console.error("HTTP request error:", error);
          }
        }
        state.currentNodeIndex++;
        break;
      }

      case "bubble-text":
      case "bubble-number": {
        const message = replaceVariables(node.config.message || node.config.number || "", state.variables);
        if (message) {
          state.messages.push({
            id: `${node.id}-${Date.now()}`,
            type: "bot",
            content: message,
          });
        }
        state.currentNodeIndex++;
        break;
      }

      default:
        state.currentNodeIndex++;
    }
  }

  return { state, result: collectedData };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/chatbot-webhook/");
    const webhookPath = pathParts[1] || "";

    console.log(`Webhook received: ${req.method} /${webhookPath}`);

    if (!webhookPath) {
      return new Response(JSON.stringify({ error: "Webhook path is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all active flows
    const { data: flows, error: flowsError } = await supabase
      .from("chatbot_flows")
      .select("*")
      .eq("is_active", true);

    if (flowsError) {
      console.error("Error fetching flows:", flowsError);
      return new Response(JSON.stringify({ error: "Failed to fetch flows" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find flow with matching webhook path
    let matchedFlow = null;
    let matchedContainer = null;
    let matchedNode = null;
    let matchedNodeIndex = 0;

    for (const flow of flows || []) {
      const containers = flow.containers || [];
      for (const container of containers) {
        for (let i = 0; i < container.nodes.length; i++) {
          const node = container.nodes[i];
          if (node.type === "webhook" && node.config.path === webhookPath) {
            // Check if method matches
            const configMethod = node.config.method || "POST";
            if (configMethod === req.method || configMethod === "ALL") {
              matchedFlow = flow;
              matchedContainer = container;
              matchedNode = node;
              matchedNodeIndex = i;
              break;
            }
          }
        }
        if (matchedFlow) break;
      }
      if (matchedFlow) break;
    }

    if (!matchedFlow || !matchedNode) {
      return new Response(JSON.stringify({ error: "Webhook not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate authentication
    const authResult = validateAuthentication(req, matchedNode.config);
    if (!authResult.valid) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse webhook payload
    let payload: any = {};
    if (req.method !== "GET") {
      try {
        payload = await req.json();
      } catch {
        // Body might be empty or not JSON
        const text = await req.text();
        payload = { body: text };
      }
    }

    // Add query params to payload
    url.searchParams.forEach((value, key) => {
      payload[key] = value;
    });

    console.log("Webhook payload:", JSON.stringify(payload));

    const containers = matchedFlow.containers || [];
    const edges = matchedFlow.edges || [];

    // Process flow from webhook node
    const { state, result } = await processFlowFromWebhook(
      containers,
      edges,
      matchedNode,
      matchedContainer.id,
      matchedNodeIndex,
      payload,
      supabase
    );

    // Determine response based on configuration
    const respondMode = matchedNode.config.respondMode || "immediately";
    const responseCode = matchedNode.config.responseCode || 200;
    const responseData = matchedNode.config.responseData || "all";

    let responseBody: any;
    if (responseData === "all") {
      responseBody = {
        success: true,
        data: result,
        messages: state.messages,
      };
    } else if (responseData === "variables") {
      responseBody = state.variables;
    } else if (responseData === "messages") {
      responseBody = { messages: state.messages };
    } else {
      responseBody = { success: true };
    }

    // Set CORS headers based on config
    const allowedOrigins = matchedNode.config.allowedOrigins || "*";
    const responseHeaders = {
      ...corsHeaders,
      "Access-Control-Allow-Origin": allowedOrigins,
      "Content-Type": "application/json",
    };

    return new Response(JSON.stringify(responseBody), {
      status: responseCode,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
