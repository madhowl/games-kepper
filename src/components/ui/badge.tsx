import { JSX, splitProps } from 'solid-js';

interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge(props: BadgeProps) {
  const [local, rest] = splitProps(props, ['class', 'variant', 'children']);
  
  const variantClass = () => {
    switch (local.variant) {
      case 'secondary':
        return 'bg-secondary text-secondary-foreground';
      case 'destructive':
        return 'bg-destructive text-destructive-foreground';
      case 'outline':
        return 'border border-input text-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };
  
  return (
    <span
      class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClass()} ${local.class || ''}`}
      {...rest}
    >
      {local.children}
    </span>
  );
}

export { Badge };
export type { BadgeProps };