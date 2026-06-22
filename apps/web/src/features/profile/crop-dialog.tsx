'use client';

import * as React from 'react';
import { Button } from '@pumni/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@pumni/ui/overlay';
import { toast } from 'sonner';
import Cropper from 'react-easy-crop';
import { cropAvatar } from './utils';

type CropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawFile: File | null;
  rawFileUrl: string | null;
  onConfirm: (blob: Blob) => void;
};

export function CropDialog({
  open,
  onOpenChange,
  rawFile,
  rawFileUrl,
  onConfirm,
}: CropDialogProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!rawFile || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await cropAvatar(rawFile, croppedAreaPixels);
      onConfirm(croppedBlob);
      onOpenChange(false);
    } catch {
      toast.error('Failed to crop image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
          <DialogTitle className="text-xl">Crop Profile Picture</DialogTitle>
          <DialogDescription className="max-w-md leading-6">
            Drag the image to pan and use the slider to zoom.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div
            className="relative h-64 w-full overflow-hidden rounded-md border border-border"
            style={{ backgroundColor: '#171717' }}
          >
            {rawFileUrl && (
              <Cropper
                image={rawFileUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            )}
          </div>
          <div className="space-y-1.5 py-4">
            <label htmlFor="zoom-slider" className="text-xs font-medium text-muted-foreground">
              Zoom
            </label>
            <input
              id="zoom-slider"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted px-6 py-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? 'Applying...' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
