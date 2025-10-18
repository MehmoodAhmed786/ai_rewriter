import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Sparkles, FileText, Download, Upload, Loader2, Copy, Check } from 'lucide-react'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [mode, setMode] = useState('humanize')
  const [tone, setTone] = useState('business')
  const [percentage, setPercentage] = useState([50])
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [modes, setModes] = useState([])
  const [tones, setTones] = useState([])

  // Fetch available modes and tones
  useEffect(() => {
    fetch('/api/modes')
      .then(res => res.json())
      .then(data => {
        setModes(data.modes || [])
        setTones(data.tones || [])
      })
      .catch(err => console.error('Failed to fetch modes:', err))
  }, [])

  const handleRewrite = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          mode,
          tone,
          percentage: mode === 'manual' ? percentage[0] : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to rewrite text')
      }

      const data = await response.json()
      setOutputText(data.rewritten_text)
    } catch (error) {
      console.error('Error rewriting text:', error)
      setOutputText('Error: Failed to rewrite text. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (outputText) {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setInputText(e.target.result)
      }
      reader.readAsText(file)
    }
  }

  const handleExport = (format) => {
    if (!outputText) return

    const blob = new Blob([outputText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rewritten-content.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const selectedMode = modes.find(m => m.id === mode)
  const selectedTone = tones.find(t => t.id === tone)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  ContentCraft
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered Content Rewriter</p>
              </div>
            </div>
            <Badge variant="secondary" className="hidden sm:flex">
              Milestone 1
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Input Content</span>
                </CardTitle>
                <CardDescription>
                  Paste your text or upload a .txt file to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload').click()}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload .txt</span>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-sm text-muted-foreground">
                    {inputText.length} characters
                  </span>
                </div>
                <Textarea
                  placeholder="Enter your content here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[300px] resize-none border-0 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Rewrite Settings</CardTitle>
                <CardDescription>
                  Customize how your content will be rewritten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Rewrite Mode</label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modes.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div>
                            <div className="font-medium">{m.name}</div>
                            <div className="text-xs text-muted-foreground">{m.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedMode && (
                    <p className="text-xs text-muted-foreground">{selectedMode.description}</p>
                  )}
                </div>

                {/* Manual Percentage */}
                {mode === 'manual' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Rewrite Percentage: {percentage[0]}%
                    </label>
                    <Slider
                      value={percentage}
                      onValueChange={setPercentage}
                      max={100}
                      min={10}
                      step={10}
                      className="w-full"
                    />
                  </div>
                )}

                <Separator />

                {/* Tone Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Tone & Style</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          <div>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-muted-foreground">{t.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTone && (
                    <p className="text-xs text-muted-foreground">{selectedTone.description}</p>
                  )}
                </div>

                <Button 
                  onClick={handleRewrite} 
                  disabled={!inputText.trim() || isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rewriting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Rewrite Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5" />
                      <span>Rewritten Content</span>
                    </CardTitle>
                    <CardDescription>
                      Your content will appear here after rewriting
                    </CardDescription>
                  </div>
                  {outputText && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="flex items-center space-x-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {outputText && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{outputText.length} characters</span>
                    <span>•</span>
                    <span>{outputText.split(' ').length} words</span>
                  </div>
                )}
                <Textarea
                  placeholder="Rewritten content will appear here..."
                  value={outputText}
                  readOnly
                  className="min-h-[300px] resize-none border-0 bg-slate-50/50 dark:bg-slate-800/50"
                />
                {outputText && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('txt')}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export .txt</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('docx')}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export .docx</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

