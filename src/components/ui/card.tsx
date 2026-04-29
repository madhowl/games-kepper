import { JSX, splitProps } from 'solid-js';

interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {}

function Card(props: CardProps) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  
  return (
    <div
      class={`rounded-lg border border-border bg-card text-card-foreground shadow-sm ${local.class || ''}`}
      {...rest}
    >
      {local.children}
    </div>
  );
}

function CardHeader(props: CardProps) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  
  return (
    <div class={`flex flex-col space-y-1.5 p-6 ${local.class || ''}`} {...rest}>
      {local.children}
    </div>
  );
}

function CardTitle(props: CardProps) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  
  return (
    <h3 class={`text-2xl font-semibold leading-none tracking-tight ${local.class || ''}`} {...rest}>
      {local.children}
    </h3>
  );
}

function CardDescription(props: CardProps) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  
  return (
    <p class={`text-sm text-muted-foreground ${local.class || ''}`} {...rest}>
      {local.children}
    </p>
  );
}

function CardContent(props: CardProps) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  
  return (
    <div class={`p-6 pt-0 ${local.class || ''}`} {...rest}>
      {local.children}
    </div>
  );
}

function CardFooter(props: CardProps) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  
  return (
    <div class={`flex items-center p-6 pt-0 ${local.class || ''}`} {...rest}>
      {local.children}
    </div>
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
export type { CardProps };