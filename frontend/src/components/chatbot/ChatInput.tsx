import { useLayoutEffect, useRef } from "react"
import { SendHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ChatInputProps = {
  value: string
  disabled?: boolean
  maxLength: number
  onChange: (value: string) => void
  onSend: () => void
}

export default function ChatInput({
  value,
  disabled = false,
  maxLength,
  onChange,
  onSend,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) return

    // Reset before measuring so the field shrinks correctly after multi-line edits.
    textarea.style.height = "0px"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`
  }, [value])

  return (
    <div className="border-t border-border bg-card p-3 sm:p-4">
      <div className="flex items-end gap-3 rounded-2xl border border-input bg-background p-2 pl-3 transition-colors focus-within:border-primary/50">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()

              if (!disabled && value.trim()) {
                onSend()
              }
            }
          }}
          placeholder="Ask about workouts, recovery, or goals..."
          className="max-h-35 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
        />

        <Button
          type="button"
          size="icon"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className={cn(
            "size-10 rounded-xl bg-primary text-primary-foreground press hover:bg-primary/90",
            "disabled:bg-muted disabled:text-muted-foreground"
          )}
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
      <div className="mt-2 text-right text-xs text-muted-foreground">
        {value.length}/{maxLength}
      </div>
    </div>
  )
}
