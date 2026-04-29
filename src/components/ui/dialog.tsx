import { Show, JSX, createSignal, onMount, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: JSX.Element;
}

function Dialog(props: DialogProps) {
  return (
    <Show when={props.open}>
      <DialogContent onClose={() => props.onOpenChange(false)}>
        {props.children}
      </DialogContent>
    </Show>
  );
}

interface DialogContentProps {
  onClose: () => void;
  children: JSX.Element;
  class?: string;
}

function DialogContent(props: DialogContentProps) {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose();
    }
  };
  
  onMount(() => {
    document.addEventListener('keydown', handleEscape);
  });
  
  onCleanup(() => {
    document.removeEventListener('keydown', handleEscape);
  });
  
  return (
    <Portal>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          class="fixed inset-0 bg-black/70" 
          onClick={() => props.onClose()}
        />
        <div 
          class={`relative z-50 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg ${props.class || ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {props.children}
        </div>
      </div>
    </Portal>
  );
}

function DialogHeader(props: { children: JSX.Element }) {
  return <div class="flex flex-col space-y-1.5 mb-4">{props.children}</div>;
}

function DialogTitle(props: { children: JSX.Element; class?: string }) {
  return (
    <h2 class={`text-xl font-semibold leading-none tracking-tight ${props.class || ''}`}>
      {props.children}
    </h2>
  );
}

function DialogDescription(props: { children: JSX.Element; class?: string }) {
  return (
    <p class={`text-sm text-muted-foreground ${props.class || ''}`}>
      {props.children}
    </p>
  );
}

function DialogFooter(props: { children: JSX.Element; class?: string }) {
  return (
    <div class={`flex justify-end gap-2 mt-4 ${props.class || ''}`}>
      {props.children}
    </div>
  );
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };