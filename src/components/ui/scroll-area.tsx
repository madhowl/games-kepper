import { JSX, splitProps } from 'solid-js';

interface ScrollAreaProps extends JSX.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both';
}

function ScrollArea(props: ScrollAreaProps) {
  const [local, rest] = splitProps(props, ['class', 'children', 'orientation']);
  
  return (
    <div
      class={`overflow-auto ${local.class || ''}`}
      {...rest}
    >
      {local.children}
    </div>
  );
}

export { ScrollArea };
export type { ScrollAreaProps };