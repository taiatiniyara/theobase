<script lang="ts">
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";

  interface Props {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: "default" | "destructive";
    onconfirm?: () => void;
  }

  let {
    open = false,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    variant = "default",
    onconfirm,
  }: Props = $props();

  function confirm() {
    onconfirm?.();
    onOpenChange?.(false);
  }
</script>

<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onclick={() => onOpenChange?.(false)}>Cancel</Button>
      <Button variant={variant === "destructive" ? "destructive" : "default"} onclick={confirm}>
        {confirmLabel}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
