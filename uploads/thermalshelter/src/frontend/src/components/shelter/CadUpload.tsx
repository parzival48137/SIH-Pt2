import type { ShelterGeometry } from "@/lib/cad-parser";
import type {
  CadParseRequest,
  CadParseResponse,
} from "@/workers/cad-parser.worker";
import { AlertTriangle, FileUp, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CadUploadProps {
  /** Called with the decomposed geometry once a mesh parses successfully. */
  onParsed: (geometry: ShelterGeometry, fileName: string) => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "parsing"; fileName: string; progress: number }
  | { status: "error"; message: string };

const ACCEPTED = ".stl,.obj";

/**
 * Binary STL / OBJ upload. The file is decoded and decomposed inside a Web
 * Worker so the interface stays responsive, with a live progress bar.
 */
export function CadUpload({ onParsed }: CadUploadProps) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const workerRef = useRef<Worker | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  function handleFile(file: File) {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".stl") && !lower.endsWith(".obj")) {
      setState({
        status: "error",
        message: "Unsupported file type. Upload a binary STL or OBJ file.",
      });
      return;
    }

    workerRef.current?.terminate();
    const worker = new Worker(
      new URL("../../workers/cad-parser.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    setState({ status: "parsing", fileName: file.name, progress: 0.05 });

    worker.onmessage = (event: MessageEvent<CadParseResponse>) => {
      const message = event.data;
      if (message.kind === "progress") {
        setState((current) =>
          current.status === "parsing"
            ? { ...current, progress: message.value }
            : current,
        );
      } else if (message.kind === "done") {
        setState({ status: "idle" });
        onParsed(message.geometry, file.name);
        worker.terminate();
        workerRef.current = null;
      } else {
        setState({ status: "error", message: message.message });
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = () => {
      setState({
        status: "error",
        message: "The mesh worker failed to start. Try a smaller file.",
      });
      worker.terminate();
      workerRef.current = null;
    };

    void file
      .arrayBuffer()
      .then((buffer) => {
        const request: CadParseRequest = { fileName: file.name, buffer };
        worker.postMessage(request, [buffer]);
      })
      .catch(() => {
        setState({
          status: "error",
          message: "Could not read the selected file.",
        });
        worker.terminate();
        workerRef.current = null;
      });
  }

  const parsing = state.status === "parsing";

  return (
    <div data-ocid="shelter.cad_upload" className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        data-ocid="shelter.cad_input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        data-ocid="shelter.upload_button"
        disabled={parsing}
        onClick={() => inputRef.current?.click()}
        className="transition-smooth flex min-h-[52px] w-full items-center justify-center gap-2 rounded-sm border border-dashed border-input bg-secondary/40 px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        {parsing ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Upload className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="font-display font-medium">
          {parsing ? "Parsing mesh…" : "Upload STL / OBJ"}
        </span>
      </button>

      {parsing ? (
        <div data-ocid="shelter.upload_progress" className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="label-tech flex min-w-0 items-center gap-1.5">
              <FileUp className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{state.fileName}</span>
            </span>
            <span className="readout text-[0.6875rem] text-primary">
              {Math.round(state.progress * 100)}%
            </span>
          </div>
          <div
            className="surface-inset h-1.5 w-full overflow-hidden rounded-full"
            aria-hidden="true"
          >
            <div
              className="h-full bg-primary transition-[width] duration-200"
              style={{ width: `${Math.round(state.progress * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      {state.status === "error" ? (
        <p
          data-ocid="shelter.upload_error"
          className="flex items-start gap-1.5 rounded-sm border border-destructive/50 bg-destructive/10 px-2.5 py-2 text-xs text-destructive"
        >
          <AlertTriangle
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>{state.message}</span>
        </p>
      ) : null}
    </div>
  );
}
