import { AlertCircleIcon, CameraIcon, CheckCircle2Icon, Loader2Icon, QrCodeIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { useUiBundle } from "#hooks/use-ui-bundle";
import { getApiErrorMessage } from "#lib/api";
import { saveTour } from "../../../services/ClientTourService";
import { tourService } from "../../../services/TourService";

type BarcodeResult = { rawValue: string };
type BarcodeDetectorInstance = { detect(source: HTMLVideoElement): Promise<BarcodeResult[]> };
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorInstance;

function normalizeTourCode(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("code")?.trim() || url.pathname.split("/").filter(Boolean).at(-1) || "";
  } catch {
    return trimmed;
  }
}

export default function MobileQrScannerPage() {
  const navigate = useNavigate();
  const { t } = useUiBundle();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const [code, setCode] = useState("");
  const [cameraMessage, setCameraMessage] = useState(() => t("qr.camera.starting"));
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string; code?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitCode = useCallback(async (rawCode: string) => {
    const normalizedCode = normalizeTourCode(rawCode);
    if (!normalizedCode || processingRef.current) return;
    processingRef.current = true;
    setSubmitting(true);
    setStatus(null);

    try {
      const response = await tourService.detailByCode(normalizedCode);
      if (!response.success || !response.data) throw new Error(response.message || t("qr.code.invalid"));
      saveTour(response.data);
      setCode(response.data.code);
      setStatus({ type: "success", message: t("qr.scan.successMessage"), code: response.data.code });
    } catch (error: unknown) {
      setStatus({ type: "error", message: error instanceof Error ? getApiErrorMessage(error, error.message) : getApiErrorMessage(error) });
      processingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [t]);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
      if (!Detector) {
        setCameraMessage(t("qr.camera.unsupported"));
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setCameraMessage(t("qr.camera.hint"));
        const detector = new Detector({ formats: ["qr_code"] });

        const scan = async () => {
          if (!active || processingRef.current) return;
          try {
            const results = await detector.detect(video);
            if (results[0]?.rawValue) {
              void submitCode(results[0].rawValue);
              return;
            }
          } catch {
            setCameraMessage(t("qr.camera.unrecognized"));
          }
          frameRef.current = requestAnimationFrame(() => void scan());
        };
        frameRef.current = requestAnimationFrame(() => void scan());
      } catch {
        setCameraMessage(t("qr.camera.unavailable"));
      }
    }

    void startCamera();
    return () => {
      active = false;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [submitCode, t]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    processingRef.current = false;
    void submitCode(code);
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("qr.travel.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("qr.travel.description")}</p>
      </div>

      <div className="relative aspect-square overflow-hidden rounded-2xl bg-foreground">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline aria-label={t("qr.camera.ariaLabel")} />
        <div className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-background shadow-[0_0_0_999px_rgb(0_0_0/0.35)]" />
        <div className="absolute inset-x-4 bottom-4 rounded-xl bg-background/90 px-3 py-2 text-center text-xs backdrop-blur-sm">
          <CameraIcon className="mr-1.5 inline size-4" aria-hidden="true" />
          {cameraMessage}
        </div>
      </div>

      {status && (
        <div className={`flex gap-3 rounded-xl border p-4 text-sm ${status.type === "error" ? "border-destructive/30 text-destructive" : "border-primary/30 text-foreground"}`} role="status">
          {status.type === "success" ? <CheckCircle2Icon className="size-5 shrink-0 text-primary" aria-hidden="true" /> : <AlertCircleIcon className="size-5 shrink-0" aria-hidden="true" />}
          <div className="flex-1">
            <p className="font-medium">{status.type === "success" ? t("qr.scan.successTitle") : t("qr.scan.errorTitle")}</p>
            <p className="mt-1 text-muted-foreground">{status.message}</p>
            {status.code && <Button className="mt-3" size="sm" type="button" onClick={() => navigate(`/du-lich/${encodeURIComponent(status.code!)}`)}>{t("qr.scan.viewTour")}</Button>}
          </div>
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium" htmlFor="tour-code">{t("qr.manual.label")}</label>
        <div className="flex gap-2">
          <Input id="tour-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder={t("qr.manual.placeholder")} autoComplete="off" />
          <Button type="submit" disabled={submitting || !code.trim()}>
            {submitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <QrCodeIcon aria-hidden="true" />}
            {t("qr.manual.submit")}
          </Button>
        </div>
      </form>
    </section>
  );
}
