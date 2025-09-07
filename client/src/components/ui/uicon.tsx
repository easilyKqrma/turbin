import { cn } from "@/lib/utils";

interface UiconProps {
  name: string;
  className?: string;
  style?: 'regular' | 'bold' | 'solid' | 'thin';
  shape?: 'rounded' | 'straight';
}

export function Uicon({ 
  name, 
  className, 
  style = 'regular', 
  shape = 'rounded' 
}: UiconProps) {
  const iconClass = `fi fi-${style[0]}${shape[0]}-${name}`;
  
  return (
    <i 
      className={cn(iconClass, className)} 
      data-testid={`uicon-${name}`}
    />
  );
}