import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SIGNED_URL_REFRESH_MS } from "@/services/storage";
import { toast } from "sonner";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Skeleton } from "@/components/ui/skeleton";
import { equipamentosService } from "@/services/queries";
import { categoriaFotoLabels } from "@/lib/labels";
import type { CategoriaFoto, EquipamentoFoto } from "@/types/domain";

const CATEGORIAS = Object.keys(categoriaFotoLabels) as CategoriaFoto[];

export function FotosGaleria({
  equipamentoId,
  fotos,
  onChange,
}: {
  equipamentoId: string;
  fotos: EquipamentoFoto[];
  onChange: () => void;
}) {
  const [categoria, setCategoria] = useState<CategoriaFoto>("entrada");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storagePaths = fotos.map((f) => f.storage_path);
  const { data: urls } = useQuery({
    queryKey: ["equipamento-fotos-signed", equipamentoId, storagePaths],
    queryFn: () => equipamentosService.fotoUrls(storagePaths),
    enabled: storagePaths.length > 0,
    // Renova as signed URLs antes do TTL expirar.
    staleTime: SIGNED_URL_REFRESH_MS,
    refetchInterval: SIGNED_URL_REFRESH_MS,
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await equipamentosService.uploadFoto(equipamentoId, categoria, file);
      toast.success("Foto adicionada");
      onChange();
    } catch (error) {
      toast.error("Não foi possível enviar a foto", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (foto: EquipamentoFoto) => {
    try {
      await equipamentosService.removerFoto(foto.id, foto.storage_path);
      toast.success("Foto removida");
      onChange();
    } catch (error) {
      toast.error("Não foi possível remover a foto", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaFoto)}>
          <SelectTrigger className="h-9 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {categoriaFotoLabels[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <LoadingState /> : <Upload className="size-4" />}
          Adicionar foto
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {fotos.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Nenhuma foto registrada"
          description="Adicione fotos de entrada, durante a manutenção, finais ou de entrega."
        />
      ) : (
        CATEGORIAS.map((cat) => {
          const fotosCategoria = fotos.filter((f) => f.categoria === cat);
          if (!fotosCategoria.length) return null;
          return (
            <div key={cat}>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {categoriaFotoLabels[cat]}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {fotosCategoria.map((foto) => (
                  <div
                    key={foto.id}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                  >
                    {urls?.[foto.storage_path] ? (
                      <img
                        src={urls[foto.storage_path]}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <Skeleton className="size-full rounded-none" />
                    )}
                    <button
                      type="button"
                      onClick={() => void handleRemove(foto)}
                      className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Remover foto</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
