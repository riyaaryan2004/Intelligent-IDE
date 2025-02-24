"use client"

import { useRef, useEffect } from "react"
import * as monaco from "monaco-editor"

interface MonacoEditorProps {
  language: string
  theme: string
  value: string
  onChange: (value: string) => void
}

export default function MonacoEditor({ language, theme, value, onChange }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (editorRef.current) {
      editorInstance.current = monaco.editor.create(editorRef.current, {
        value,
        language,
        theme,
        automaticLayout: true,
      })

      editorInstance.current.onDidChangeModelContent(() => {
        onChange(editorInstance.current?.getValue() || "")
      })
    }

    return () => {
      editorInstance.current?.dispose()
    }
  }, [language, theme, onChange, value])

  useEffect(() => {
    if (editorInstance.current) {
      const model = editorInstance.current.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, language)
      }
    }
  }, [language])

  useEffect(() => {
    if (editorInstance.current) {
      editorInstance.current.updateOptions({ theme })
    }
  }, [theme])

  return <div ref={editorRef} style={{ width: "100%", height: "100%" }} />
}

