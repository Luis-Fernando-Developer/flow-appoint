import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
  isVideo?: boolean;
  isImage?: boolean;
  isFile?: boolean;
  isAudio?: boolean;
  alt?: string;
}

interface SessionState {
  messages: Message[];
  variables: Record<string, string>;
  currentContainerId: string | null;
  currentNodeIndex: number;
  waitingFor: string | null;
  waitingNodeId: string | null;
  buttons?: Array<{ id: string; label: string; value?: string }>;
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
    case "greater_than": {
      const numVar = Number(normalizedVar);
      const numCompare = Number(normalizedCompare);
      if (!Number.isNaN(numVar) && !Number.isNaN(numCompare)) return numVar > numCompare;
      return normalizedVar > normalizedCompare;
    }
    case "less_than": {
      const numVar = Number(normalizedVar);
      const numCompare = Number(normalizedCompare);
      if (!Number.isNaN(numVar) && !Number.isNaN(numCompare)) return numVar < numCompare;
      return normalizedVar < normalizedCompare;
    }
    case "is_set":
      return normalizedVar !== "";
    case "is_empty":
      return normalizedVar === "";
    case "starts_with":
      return normalizedVar.startsWith(normalizedCompare);
    case "ends_with":
      return normalizedVar.endsWith(normalizedCompare);
    case "matches_regex":
      try {
        const match = normalizedCompare.match(/^\/(.*)\/([gimsuy]*)$/);
        const regex = match ? new RegExp(match[1], match[2]) : new RegExp(normalizedCompare);
        return regex.test(normalizedVar);
      } catch {
        return false;
      }
    case "not_matches_regex":
      try {
        const match = normalizedCompare.match(/^\/(.*)\/([gimsuy]*)$/);
        const regex = match ? new RegExp(match[1], match[2]) : new RegExp(normalizedCompare);
        return !regex.test(normalizedVar);
      } catch {
        return true;
      }
    default:
      return false;
  }
};

// Process nodes and return response
async function processFlow(
  containers: any[],
  edges: any[],
  state: SessionState,
  supabase: any
): Promise<SessionState> {
  const maxIterations = 100;
  let iterations = 0;

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
      // No more nodes to process
      break;
    }

    const node = container.nodes[state.currentNodeIndex];
    console.log(`Processing node: ${node.type} (${node.id})`);

    switch (node.type) {
      case "start": {
        const initialVars = node.config.initialVariables || [];
        initialVars.forEach(({ name, defaultValue }: { name: string; defaultValue: string }) => {
          if (name) {
            state.variables[name] = defaultValue || "";
          }
        });
        state.currentNodeIndex++;
        break;
      }

      case "webhook": {
        // In runtime, webhook data is already set by webhook handler
        const responseVariable = node.config.responseVariable || "webhookData";
        if (!state.variables[responseVariable]) {
          state.variables[responseVariable] = JSON.stringify({ test: true, timestamp: Date.now() });
        }
        state.currentNodeIndex++;
        break;
      }

      case "http-request": {
        const { method = "GET", url, responseVariable = "httpResponse", body, headers = {} } = node.config;
        const processedUrl = replaceVariables(url || "", state.variables);
        
        if (processedUrl) {
          try {
            const fetchOptions: RequestInit = {
              method,
              headers: {
                "Content-Type": "application/json",
                ...headers,
              },
            };
            
            if (body && ["POST", "PUT", "PATCH"].includes(method)) {
              fetchOptions.body = replaceVariables(body, state.variables);
            }
            
            const response = await fetch(processedUrl, fetchOptions);
            const text = await response.text();
            let data = text;
            try { data = JSON.stringify(JSON.parse(text)); } catch {}
            
            state.variables[responseVariable] = data;
            state.messages.push({
              id: `http-${Date.now()}`,
              type: "bot",
              content: `✅ HTTP ${response.status}`,
            });
          } catch (error: any) {
            state.messages.push({
              id: `http-err-${Date.now()}`,
              type: "bot",
              content: `❌ Erro HTTP: ${error.message}`,
            });
          }
        }
        state.currentNodeIndex++;
        break;
      }

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
          case "yesterday": {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            value = d.toISOString().split("T")[0];
            break;
          }
          case "tomorrow": {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            value = d.toISOString().split("T")[0];
            break;
          }
          case "random":
            value = Math.random().toString(36).substring(7);
            break;
          case "custom":
          default:
            value = replaceVariables(node.config.customValue || node.config.value || "", state.variables);
        }

        if (variableName) {
          state.variables[variableName] = value;
        }
        state.currentNodeIndex++;
        break;
      }

      case "condition": {
        const sanitize = (name: string) => (name || "").trim().replace(/^{{\s*/, "").replace(/\s*}}$/, "");
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
            const rawVarName = comparison.variableName || "";
            const varName = sanitize(rawVarName);
            const varValue = (state.variables[varName] ?? state.variables[rawVarName] ?? "") as string;
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

      case "bubble-image": {
        if (node.config.ImageURL) {
          state.messages.push({
            id: `${node.id}-${Date.now()}`,
            type: "bot",
            content: node.config.ImageURL,
            isImage: true,
            alt: node.config.ImageAlt || "Imagem",
          });
        }
        state.currentNodeIndex++;
        break;
      }

      case "bubble-video": {
        if (node.config.VideoURL) {
          state.messages.push({
            id: `${node.id}-${Date.now()}`,
            type: "bot",
            content: node.config.VideoURL,
            isVideo: true,
          });
        }
        state.currentNodeIndex++;
        break;
      }

      case "bubble-audio": {
        if (node.config.AudioURL) {
          state.messages.push({
            id: `${node.id}-${Date.now()}`,
            type: "bot",
            content: node.config.AudioURL,
            isAudio: true,
            alt: node.config.AudioAlt || "Áudio",
          });
        }
        state.currentNodeIndex++;
        break;
      }

      case "input-text":
      case "input-number":
      case "input-mail":
      case "input-phone":
      case "input-webSite": {
        state.waitingFor = node.type;
        state.waitingNodeId = node.id;
        return state; // Pause and wait for user input
      }

      case "input-buttons": {
        const buttons = (node.config.buttons || []).map((btn: any) => ({
          id: btn.id,
          label: btn.label,
          value: btn.value || btn.label,
        }));
        state.buttons = buttons;
        state.waitingFor = "buttons";
        state.waitingNodeId = node.id;
        return state; // Pause and wait for button click
      }

      case "script": {
        // Script execution is limited on server - just replace variables
        console.log("Script node skipped on server (client-only execution)");
        state.currentNodeIndex++;
        break;
      }

      default:
        console.log(`Unknown node type: ${node.type}`);
        state.currentNodeIndex++;
    }
  }

  state.waitingFor = null;
  return state;
}

// Handle user message and continue flow
async function handleUserMessage(
  state: SessionState,
  message: string,
  buttonId: string | null,
  containers: any[],
  edges: any[],
  supabase: any
): Promise<SessionState> {
  if (!state.waitingNodeId) {
    return state;
  }

  const container = containers.find((c: any) => c.id === state.currentContainerId);
  if (!container) return state;

  const node = container.nodes[state.currentNodeIndex];
  if (!node || node.id !== state.waitingNodeId) return state;

  // Save user input to variable
  const saveVariable = node.config.saveVariable;
  
  if (state.waitingFor === "buttons" && buttonId) {
    const button = state.buttons?.find((b) => b.id === buttonId);
    if (button) {
      const valueToSave = button.value || button.label;
      if (saveVariable) {
        state.variables[saveVariable] = valueToSave;
      }
      state.messages.push({
        id: `user-${Date.now()}`,
        type: "user",
        content: button.label,
      });

      // Check for button-specific edge
      const buttonEdge = edges.find((e: any) => e.sourceHandle === `${node.id}-btn-${buttonId}`);
      if (buttonEdge) {
        const targetContainer = containers.find((c: any) => c.id === buttonEdge.target);
        if (targetContainer) {
          state.currentContainerId = targetContainer.id;
          state.currentNodeIndex = 0;
          state.waitingFor = null;
          state.waitingNodeId = null;
          state.buttons = undefined;
          return processFlow(containers, edges, state, supabase);
        }
      }

      // Check for default edge
      const defaultEdge = edges.find((e: any) => e.sourceHandle === `${node.id}-default`);
      if (defaultEdge) {
        const targetContainer = containers.find((c: any) => c.id === defaultEdge.target);
        if (targetContainer) {
          state.currentContainerId = targetContainer.id;
          state.currentNodeIndex = 0;
          state.waitingFor = null;
          state.waitingNodeId = null;
          state.buttons = undefined;
          return processFlow(containers, edges, state, supabase);
        }
      }
    }
  } else if (message) {
    if (saveVariable) {
      state.variables[saveVariable] = message;
    }
    state.messages.push({
      id: `user-${Date.now()}`,
      type: "user",
      content: message,
    });
  }

  state.currentNodeIndex++;
  state.waitingFor = null;
  state.waitingNodeId = null;
  state.buttons = undefined;

  return processFlow(containers, edges, state, supabase);
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
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1]; // start, message, or session

    console.log(`Chatbot Runtime: ${req.method} ${action}`);

    // POST /start - Start new session
    if (action === "start" && req.method === "POST") {
      const { flow_id, company_id, client_id, initial_variables } = await req.json();

      if (!flow_id) {
        return new Response(JSON.stringify({ error: "flow_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch flow
      const { data: flow, error: flowError } = await supabase
        .from("chatbot_flows")
        .select("*")
        .eq("id", flow_id)
        .eq("is_active", true)
        .single();

      if (flowError || !flow) {
        console.error("Flow not found:", flowError);
        return new Response(JSON.stringify({ error: "Flow not found or inactive" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const containers = flow.containers || [];
      const edges = flow.edges || [];

      // Find start container
      const startContainer = containers.find((c: any) =>
        c.nodes.some((n: any) => n.type === "start")
      );

      if (!startContainer) {
        return new Response(JSON.stringify({ error: "No start node found in flow" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Initialize session state
      const state: SessionState = {
        messages: [],
        variables: initial_variables || {},
        currentContainerId: startContainer.id,
        currentNodeIndex: 0,
        waitingFor: null,
        waitingNodeId: null,
      };

      // Process flow until waiting for input
      const processedState = await processFlow(containers, edges, state, supabase);

      // Create session in database
      const sessionId = crypto.randomUUID();
      const { error: insertError } = await supabase.from("chatbot_sessions").insert({
        id: sessionId,
        flow_id,
        company_id,
        client_id,
        state: processedState,
        status: processedState.waitingFor ? "active" : "completed",
      });

      if (insertError) {
        console.error("Failed to create session:", insertError);
      }

      return new Response(
        JSON.stringify({
          session_id: sessionId,
          messages: processedState.messages,
          waiting_for: processedState.waitingFor,
          buttons: processedState.buttons,
          variables: processedState.variables,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /message - Send user message
    if (action === "message" && req.method === "POST") {
      const { session_id, message, button_id } = await req.json();

      if (!session_id) {
        return new Response(JSON.stringify({ error: "session_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch session
      const { data: session, error: sessionError } = await supabase
        .from("chatbot_sessions")
        .select("*, chatbot_flows(*)")
        .eq("id", session_id)
        .single();

      if (sessionError || !session) {
        console.error("Session not found:", sessionError);
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const flow = session.chatbot_flows;
      const containers = flow.containers || [];
      const edges = flow.edges || [];
      let state = session.state as SessionState;

      // Handle user message
      state = await handleUserMessage(state, message, button_id, containers, edges, supabase);

      // Update session in database
      await supabase
        .from("chatbot_sessions")
        .update({
          state,
          status: state.waitingFor ? "active" : "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", session_id);

      return new Response(
        JSON.stringify({
          session_id,
          messages: state.messages,
          waiting_for: state.waitingFor,
          buttons: state.buttons,
          variables: state.variables,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /session/:id - Get session state
    if (action.match(/^[0-9a-f-]{36}$/) && req.method === "GET") {
      const sessionId = action;

      const { data: session, error } = await supabase
        .from("chatbot_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error || !session) {
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const state = session.state as SessionState;
      return new Response(
        JSON.stringify({
          session_id: sessionId,
          messages: state.messages,
          waiting_for: state.waitingFor,
          buttons: state.buttons,
          variables: state.variables,
          status: session.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE /session/:id - End session
    if (action.match(/^[0-9a-f-]{36}$/) && req.method === "DELETE") {
      const sessionId = action;

      await supabase
        .from("chatbot_sessions")
        .update({ status: "ended", updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Chatbot Runtime Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
