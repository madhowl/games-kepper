import { createSignal, onMount, Show } from 'solid-js';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent } from '../ui/dialog';

interface CardTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  icon: string;
}

const CARD_TEMPLATES: CardTemplate[] = [
  { id: 'standard', name: 'Стандартная карта', width: 63, height: 88, icon: '🃏' },
  { id: 'double', name: 'Двусторонняя карта', width: 63, height: 88, icon: '🔄' },
  { id: 'token', name: 'Фишка', width: 20, height: 20, icon: '🪙' },
  { id: 'mini', name: 'Мини карта', width: 45, height: 63, icon: '🎴' },
  { id: 'tarot', name: 'Таро', width: 70, height: 120, icon: '🔮' },
];

interface CardConstructorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentId?: number;
  onSave?: (imageData: string) => void;
}

export function CardConstructor(props: CardConstructorProps) {
  const [template, setTemplate] = createSignal<CardTemplate>(CARD_TEMPLATES[0]);
  const [cardName, setCardName] = createSignal('');
  const [cardText, setCardText] = createSignal('');
  const [cardType, setCardType] = createSignal('action');
  const [cardCost, setCardCost] = createSignal(0);
  const [bgColor, setBgColor] = createSignal('#ffffff');
  const [borderColor, setBorderColor] = createSignal('#000000');
  const [isSaving, setIsSaving] = createSignal(false);
  
  let canvasRef: HTMLCanvasElement | undefined;

  const templateOptions = CARD_TEMPLATES.map(t => ({
    value: t.id,
    label: `${t.icon} ${t.name} (${t.width}x${t.height}мм)`
  }));

  const drawCard = () => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    const t = template();
    const scale = 10;
    const w = t.width * scale;
    const h = t.height * scale;

    canvasRef.width = w;
    canvasRef.height = h;

    ctx.fillStyle = bgColor();
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = borderColor();
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, w - 10, h - 10);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cardName() || 'Название', w/2, 30);

    if (cardType() === 'action') {
      ctx.font = '14px sans-serif';
      ctx.fillText(cardText() || 'Текст карты', w/2, h/2);
    } else if (cardType() === 'resource') {
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText(cardCost().toString(), w/2, h/2 + 15);
    }
  };

  onMount(drawCard);

  const handleTemplateChange = (id: string) => {
    const t = CARD_TEMPLATES.find(x => x.id === id);
    if (t) setTemplate(t);
    setTimeout(drawCard, 50);
  };

  const handleExport = () => {
    if (!canvasRef) return;
    const dataUrl = canvasRef.toDataURL('image/png');
    console.log('Export card:', cardName(), template(), dataUrl.substring(0, 50) + '...');
    props.onOpenChange(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Конструктор карт 🎨</DialogTitle>
          <DialogDescription>Создайте дизайн карты</DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-4 py-4">
          <div class="flex gap-4">
            <div class="w-1/3">
              <label class="text-sm text-muted-foreground mb-1 block">Шаблон</label>
              <Select
                value={template().id}
                onChange={(e) => handleTemplateChange(e.currentTarget.value)}
                options={templateOptions}
              />
            </div>
            <div class="flex-1">
              <label class="text-sm text-muted-foreground mb-1 block">Название</label>
              <Input
                placeholder="Название карты"
                value={cardName()}
                onInput={(e) => { setCardName(e.currentTarget.value); drawCard(); }}
              />
            </div>
          </div>

          <div class="flex gap-4">
            <div class="w-1/3">
              <label class="text-sm text-muted-foreground mb-1 block">Тип карты</label>
              <Select
                value={cardType()}
                onChange={(e) => { setCardType(e.currentTarget.value); drawCard(); }}
                options={[
                  { value: 'action', label: 'Действие' },
                  { value: 'resource', label: 'Ресурс' },
                  { value: 'victory', label: 'Победа' },
                ]}
              />
            </div>
            <Show when={cardType() === 'resource'}>
              <div class="w-1/3">
                <label class="text-sm text-muted-foreground mb-1 block">Номинал</label>
                <Input
                  type="number"
                  min="0"
                  value={cardCost()}
                  onInput={(e) => { setCardCost(parseInt(e.currentTarget.value) || 0); drawCard(); }}
                />
              </div>
            </Show>
          </div>

          <Show when={cardType() === 'action'}>
            <div>
              <label class="text-sm text-muted-foreground mb-1 block">Текст</label>
              <Input
                placeholder="Текст карты"
                value={cardText()}
                onInput={(e) => { setCardText(e.currentTarget.value); drawCard(); }}
              />
            </div>
          </Show>

          <div class="flex gap-4">
            <div>
              <label class="text-sm text-muted-foreground mb-1 block">Фон</label>
              <input
                type="color"
                value={bgColor()}
                onInput={(e) => { setBgColor(e.currentTarget.value); drawCard(); }}
              />
            </div>
            <div>
              <label class="text-sm text-muted-foreground mb-1 block">Рамка</label>
              <input
                type="color"
                value={borderColor()}
                onInput={(e) => { setBorderColor(e.currentTarget.value); drawCard(); }}
              />
            </div>
          </div>

          <div class="flex justify-center border rounded p-2 bg-white">
            <canvas ref={canvasRef} class="max-w-full" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleExport} disabled={isSaving() || !cardName()}>
            💾 Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}