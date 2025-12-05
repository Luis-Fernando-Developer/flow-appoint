import { NodeConfig } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BubbleAudioConfigProps {
  config: NodeConfig;
  setConfig: (config: NodeConfig) => void;
}

export const BubbleAudioConfig = ({ config, setConfig }: BubbleAudioConfigProps) => {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="audioUrl">URL do Áudio</Label>
        <Input
          id="audioUrl"
          type="text"
          placeholder="https://exemplo.com/audio.mp3"
          value={config.AudioURL || ""}
          onChange={(e) => setConfig({ ...config, AudioURL: e.target.value })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="autoplay">Reproduzir automaticamente</Label>
        <Switch
          id="autoplay"
          checked={config.AudioAutoplay || false}
          onCheckedChange={(checked) => setConfig({ ...config, AudioAutoplay: checked })}
        />
      </div>
    </div>
  );
};
