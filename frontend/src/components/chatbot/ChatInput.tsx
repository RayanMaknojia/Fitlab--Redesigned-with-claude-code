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
    <div className="border-t border-white/10 bg-black/10 p-3 sm:p-4">
      <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-black/20 p-2 pl-3 shadow-inner shadow-black/20 backdrop-blur-sm">
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
          className="max-h-35 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm leading-6 text-white outline-none placeholder:text-white/55"
        />

        <Button
          type="button"
          size="icon"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className={cn(
            "size-10 rounded-xl bg-lime-400 text-black shadow-[0_10px_24px_-16px_oklch(0.78_0.19_134/0.95)] hover:bg-lime-300",
            "disabled:bg-muted disabled:text-muted-foreground"
          )}
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
      <div className="mt-2 text-right text-xs text-white/45">
        {value.length}/{maxLength}
      </div>
    </div>
  )
}
