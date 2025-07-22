import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { Separator } from './components/ui/separator'
import { ScrollArea } from './components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
import { Label } from './components/ui/label'
import { Textarea } from './components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Search, Plus, Download, Copy, Trash2, Code, Play, Settings, GripVertical, AlertCircle, CheckCircle, Edit, Save, X } from 'lucide-react'
import { toast } from './hooks/use-toast'
import { Toaster } from './components/ui/toaster'

interface Snippet {
  id: string
  name: string
  description: string
  category: string
  code: string
  parameters?: string[]
  isCustom?: boolean
}

interface Blueprint {
  id: string
  snippet: Snippet
  order: number
  customParams?: Record<string, string>
}

interface GlobalConfig {
  [key: string]: {
    name: string
    label: string
    value: string
  }
}

const SAMPLE_SNIPPETS: Snippet[] = [
  {
    id: '1',
    name: 'DOM Element Selector',
    description: 'Select DOM elements with error handling',
    category: 'DOM Manipulation',
    code: `function selectElement(selector) {
  const element = document.querySelector(%selector%);
  if (!element) {
    console.warn(\`Element not found: \${%selector%}\`);
    return null;
  }
  return element;
}`,
    parameters: ['selector']
  },
  {
    id: '2',
    name: 'Event Listener Helper',
    description: 'Add event listeners with cleanup',
    category: 'Event Handling',
    code: `function addEventListenerWithCleanup(element, event, handler) {
  element.addEventListener(%event%, %handler%);
  return () => element.removeEventListener(%event%, %handler%);
}`,
    parameters: ['element', 'event', 'handler']
  },
  {
    id: '3',
    name: 'API Fetch Wrapper',
    description: 'Fetch API with error handling and timeout',
    category: 'Network Operations',
    code: `async function fetchWithTimeout(url, options = {}, timeout = %timeout%) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), %timeout%);
  
  try {
    const response = await fetch(%url%, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}`,
    parameters: ['url', 'timeout']
  },
  {
    id: '4',
    name: 'Local Storage Manager',
    description: 'Safe localStorage operations with JSON support',
    category: 'Data Storage',
    code: `const storage = {
  set(key, value) {
    try {
      localStorage.setItem(%storagePrefix% + key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(%storagePrefix% + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(%storagePrefix% + key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }
};`,
    parameters: ['storagePrefix']
  },
  {
    id: '5',
    name: 'Debounce Function',
    description: 'Debounce function calls to improve performance',
    category: 'Performance Utilities',
    code: `function debounce(func, wait = %debounceDelay%) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}`,
    parameters: ['debounceDelay']
  },
  {
    id: '6',
    name: 'Form Validator',
    description: 'Validate form fields with custom rules',
    category: 'Form Validation',
    code: `function validateForm(formData, rules) {
  const errors = {};
  
  for (const [field, value] of Object.entries(formData)) {
    const fieldRules = rules[field];
    if (!fieldRules) continue;
    
    if (fieldRules.required && (!value || value.trim() === '')) {
      errors[field] = \`\${field} is required\`;
      continue;
    }
    
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = \`\${field} must be at least \${fieldRules.minLength} characters\`;
    }
    
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.message || \`\${field} format is invalid\`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}`,
    parameters: []
  },
  {
    id: '7',
    name: 'Cookie Manager',
    description: 'Manage browser cookies with expiration',
    category: 'Data Storage',
    code: `const cookieManager = {
  set(name, value, days = %cookieExpiry%) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = \`\${name}=\${value};expires=\${expires.toUTCString()};path=/\`;
  },
  
  get(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },
  
  delete(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
};`,
    parameters: ['cookieExpiry']
  },
  {
    id: '8',
    name: 'Animation Helper',
    description: 'Smooth CSS animations with callbacks',
    category: 'UI Animations',
    code: `function animateElement(element, className, duration = %animationDuration%) {
  return new Promise((resolve) => {
    element.classList.add(className);
    
    const handleAnimationEnd = () => {
      element.classList.remove(className);
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    };
    
    element.addEventListener('animationend', handleAnimationEnd);
    
    // Fallback timeout
    setTimeout(() => {
      element.classList.remove(className);
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    }, duration);
  });
}`,
    parameters: ['animationDuration']
  }
]

const CATEGORIES = [
  'All', 
  'DOM Manipulation', 
  'Event Handling', 
  'Network Operations', 
  'Data Storage', 
  'Performance Utilities', 
  'Form Validation', 
  'UI Animations',
  'Custom'
]

export default function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [generatedScript, setGeneratedScript] = useState('')
  const [customSnippets, setCustomSnippets] = useState<Snippet[]>([])
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({})
  const [syntaxErrors, setSyntaxErrors] = useState<string[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  
  // Dialog states
  const [isAddSnippetOpen, setIsAddSnippetOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [editingBlueprint, setEditingBlueprint] = useState<string | null>(null)
  
  // Form states
  const [newSnippet, setNewSnippet] = useState({
    name: '',
    description: '',
    category: 'Custom',
    code: '',
    parameters: ''
  })

  const allSnippets = [...SAMPLE_SNIPPETS, ...customSnippets]

  const filteredSnippets = allSnippets.filter(snippet => {
    const matchesSearch = snippet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || snippet.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addBlueprint = useCallback((snippet: Snippet) => {
    const newBlueprint: Blueprint = {
      id: `blueprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      snippet,
      order: blueprints.length,
      customParams: {}
    }
    setBlueprints(prev => [...prev, newBlueprint])
    toast({
      title: "Blueprint Added",
      description: `${snippet.name} has been added to your script.`
    })
  }, [blueprints.length])

  const removeBlueprint = useCallback((blueprintId: string) => {
    setBlueprints(prev => prev.filter(bp => bp.id !== blueprintId))
    toast({
      title: "Blueprint Removed",
      description: "Blueprint has been removed from your script."
    })
  }, [])

  const updateBlueprintParams = useCallback((blueprintId: string, params: Record<string, string>) => {
    setBlueprints(prev => prev.map(bp => 
      bp.id === blueprintId ? { ...bp, customParams: params } : bp
    ))
  }, [])

  const reorderBlueprints = useCallback((dragIndex: number, hoverIndex: number) => {
    setBlueprints(prev => {
      const newBlueprints = [...prev]
      const draggedBlueprint = newBlueprints[dragIndex]
      newBlueprints.splice(dragIndex, 1)
      newBlueprints.splice(hoverIndex, 0, draggedBlueprint)
      return newBlueprints.map((bp, index) => ({ ...bp, order: index }))
    })
  }, [])

  const validateSyntax = useCallback((code: string): string[] => {
    const errors: string[] = []
    
    // Basic syntax validation
    const openBraces = (code.match(/{/g) || []).length
    const closeBraces = (code.match(/}/g) || []).length
    if (openBraces !== closeBraces) {
      errors.push('Mismatched curly braces')
    }
    
    const openParens = (code.match(/\(/g) || []).length
    const closeParens = (code.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      errors.push('Mismatched parentheses')
    }
    
    // Check for common syntax errors
    if (code.includes('function(')) {
      errors.push('Missing space after function keyword')
    }
    
    if (code.includes('if(')) {
      errors.push('Missing space after if keyword')
    }
    
    return errors
  }, [])

  const processSnippetCode = useCallback((code: string, params: Record<string, string>, config: GlobalConfig): string => {
    let processedCode = code
    
    // Replace parameter placeholders
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `%${key}%`
      processedCode = processedCode.replace(new RegExp(placeholder, 'g'), value)
    })
    
    // Replace config variable placeholders
    Object.entries(config).forEach(([configKey, configValue]) => {
      const placeholder = `%${configKey}%`
      processedCode = processedCode.replace(new RegExp(placeholder, 'g'), configValue.value)
    })
    
    return processedCode
  }, [])

  const generateScript = useCallback(() => {
    if (blueprints.length === 0) {
      toast({
        title: "No Blueprints",
        description: "Add some blueprints to generate a script.",
        variant: "destructive"
      })
      return
    }

    const sortedBlueprints = [...blueprints].sort((a, b) => a.order - b.order)
    
    // Generate config object
    const configLine = Object.keys(globalConfig).length > 0 
      ? `var config = ${JSON.stringify(
          Object.fromEntries(
            Object.entries(globalConfig).map(([key, value]) => [key, {
              name: value.name,
              label: value.label,
              value: value.value
            }])
          ), null, 2
        )};`
      : ''
    
    const scriptParts = [
      '// Generated Script from Blueprint Generator',
      '// Generated on: ' + new Date().toISOString(),
      '',
      configLine,
      configLine ? '' : null,
      ...sortedBlueprints.map(bp => {
        const processedCode = processSnippetCode(
          bp.snippet.code, 
          bp.customParams || {}, 
          globalConfig
        )
        return [
          `// ${bp.snippet.name} - ${bp.snippet.description}`,
          processedCode,
          ''
        ]
      }).flat()
    ].filter(line => line !== null)

    const script = scriptParts.join('\n')
    
    // Validate syntax
    const errors = validateSyntax(script)
    setSyntaxErrors(errors)
    
    setGeneratedScript(script)
    toast({
      title: errors.length > 0 ? "Script Generated with Warnings" : "Script Generated",
      description: `Generated script with ${blueprints.length} blueprints${errors.length > 0 ? ` (${errors.length} warnings)` : ''}.`,
      variant: errors.length > 0 ? "destructive" : "default"
    })
  }, [blueprints, globalConfig, processSnippetCode, validateSyntax])

  const addCustomSnippet = useCallback(() => {
    if (!newSnippet.name || !newSnippet.code) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a name and code for the snippet.",
        variant: "destructive"
      })
      return
    }

    const snippet: Snippet = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newSnippet.name,
      description: newSnippet.description,
      category: newSnippet.category,
      code: newSnippet.code,
      parameters: newSnippet.parameters.split(',').map(p => p.trim()).filter(p => p),
      isCustom: true
    }

    setCustomSnippets(prev => [...prev, snippet])
    setNewSnippet({ name: '', description: '', category: 'Custom', code: '', parameters: '' })
    setIsAddSnippetOpen(false)
    
    toast({
      title: "Custom Snippet Added",
      description: `${snippet.name} has been added to your library.`
    })
  }, [newSnippet])

  const addGlobalConfigVar = useCallback(() => {
    const key = `var${Object.keys(globalConfig).length + 1}`
    setGlobalConfig(prev => ({
      ...prev,
      [key]: {
        name: `param${Object.keys(prev).length + 1}`,
        label: `Parameter ${Object.keys(prev).length + 1}`,
        value: ''
      }
    }))
  }, [globalConfig])

  const updateGlobalConfigVar = useCallback((key: string, field: 'name' | 'label' | 'value', value: string) => {
    setGlobalConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }, [])

  const removeGlobalConfigVar = useCallback((key: string) => {
    setGlobalConfig(prev => {
      const newConfig = { ...prev }
      delete newConfig[key]
      return newConfig
    })
  }, [])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(generatedScript)
    toast({
      title: "Copied to Clipboard",
      description: "Generated script has been copied to your clipboard."
    })
  }, [generatedScript])

  const downloadScript = useCallback(() => {
    const blob = new Blob([generatedScript], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `generated-script-${Date.now()}.js`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: "Script Downloaded",
      description: "Your generated script has been downloaded."
    })
  }, [generatedScript])

  const handleDragStart = (e: React.DragEvent, blueprintId: string, index: number) => {
    setDraggedItem(blueprintId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', blueprintId)
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (dragIndex !== dropIndex) {
      reorderBlueprints(dragIndex, dropIndex)
    }
    setDraggedItem(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Script Blueprint Generator</h1>
          <p className="text-lg text-gray-600">
            Assemble JavaScript scripts from your snippet library using visual blueprints with global configuration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Snippet Library Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Snippet Library
                    </CardTitle>
                    <CardDescription>
                      Browse and search your JavaScript snippets
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Global Configuration Variables</DialogTitle>
                          <DialogDescription>
                            Define global variables that can be used across all snippets
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {Object.entries(globalConfig).map(([key, config]) => (
                            <div key={key} className="grid grid-cols-4 gap-2 items-center p-3 border rounded">
                              <Input
                                placeholder="Name"
                                value={config.name}
                                onChange={(e) => updateGlobalConfigVar(key, 'name', e.target.value)}
                              />
                              <Input
                                placeholder="Label"
                                value={config.label}
                                onChange={(e) => updateGlobalConfigVar(key, 'label', e.target.value)}
                              />
                              <Input
                                placeholder="Value"
                                value={config.value}
                                onChange={(e) => updateGlobalConfigVar(key, 'value', e.target.value)}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeGlobalConfigVar(key)}
                                className="text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button onClick={addGlobalConfigVar} variant="outline" className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Global Variable
                          </Button>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setIsConfigOpen(false)}>Done</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={isAddSnippetOpen} onOpenChange={setIsAddSnippetOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Custom Snippet</DialogTitle>
                          <DialogDescription>
                            Create a new JavaScript snippet for your library
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                value={newSnippet.name}
                                onChange={(e) => setNewSnippet(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Snippet name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="category">Category</Label>
                              <Select
                                value={newSnippet.category}
                                onValueChange={(value) => setNewSnippet(prev => ({ ...prev, category: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.filter(cat => cat !== 'All').map(category => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                              id="description"
                              value={newSnippet.description}
                              onChange={(e) => setNewSnippet(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Brief description of what this snippet does"
                            />
                          </div>
                          <div>
                            <Label htmlFor="parameters">Parameters (comma-separated)</Label>
                            <Input
                              id="parameters"
                              value={newSnippet.parameters}
                              onChange={(e) => setNewSnippet(prev => ({ ...prev, parameters: e.target.value }))}
                              placeholder="param1, param2, param3"
                            />
                          </div>
                          <div>
                            <Label htmlFor="code">Code</Label>
                            <Textarea
                              id="code"
                              value={newSnippet.code}
                              onChange={(e) => setNewSnippet(prev => ({ ...prev, code: e.target.value }))}
                              placeholder="function myFunction() {&#10;  // Your code here&#10;  // Use %paramName% for parameters&#10;}"
                              className="font-mono text-sm"
                              rows={10}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddSnippetOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addCustomSnippet}>
                            <Save className="h-4 w-4 mr-2" />
                            Add Snippet
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 pb-4">
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search snippets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {CATEGORIES.map(category => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Snippet List */}
                <ScrollArea className="h-[calc(100%-200px)]">
                  <div className="p-6 pt-0 space-y-3">
                    {filteredSnippets.map(snippet => (
                      <Card key={snippet.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-sm">{snippet.name}</h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addBlueprint(snippet)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{snippet.description}</p>
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="text-xs">
                              {snippet.category}
                            </Badge>
                            <div className="flex items-center gap-2">
                              {snippet.isCustom && (
                                <Badge variant="secondary" className="text-xs">
                                  Custom
                                </Badge>
                              )}
                              {snippet.parameters && snippet.parameters.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {snippet.parameters.length} params
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="canvas" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="canvas">Script Canvas</TabsTrigger>
                <TabsTrigger value="preview">Code Preview</TabsTrigger>
              </TabsList>

              {/* Script Canvas */}
              <TabsContent value="canvas" className="h-[calc(100%-60px)]">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Script Assembly Canvas</CardTitle>
                        <CardDescription>
                          Your selected blueprints ({blueprints.length}) - Drag to reorder
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={generateScript} className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Generate Script
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100%-100px)]">
                      {blueprints.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                          <Code className="h-12 w-12 mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No blueprints added yet</p>
                          <p className="text-sm text-center">
                            Select snippets from the library to start building your script
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {blueprints.map((blueprint, index) => (
                            <Card 
                              key={blueprint.id} 
                              className={`border-l-4 border-l-blue-500 ${draggedItem === blueprint.id ? 'opacity-50' : ''}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, blueprint.id, index)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-start gap-3 flex-1">
                                    <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-move" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                          #{index + 1}
                                        </span>
                                        <h3 className="font-semibold">{blueprint.snippet.name}</h3>
                                      </div>
                                      <p className="text-sm text-gray-600">{blueprint.snippet.description}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {blueprint.snippet.parameters && blueprint.snippet.parameters.length > 0 && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingBlueprint(editingBlueprint === blueprint.id ? null : blueprint.id)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeBlueprint(blueprint.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Parameter Editing */}
                                {editingBlueprint === blueprint.id && blueprint.snippet.parameters && (
                                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                    <h4 className="text-sm font-medium mb-2">Customize Parameters:</h4>
                                    <div className="space-y-2">
                                      {blueprint.snippet.parameters.map(param => (
                                        <div key={param} className="flex items-center gap-2">
                                          <Label className="text-xs w-20">{param}:</Label>
                                          <Input
                                            size="sm"
                                            placeholder={`Enter ${param} value`}
                                            value={blueprint.customParams?.[param] || ''}
                                            onChange={(e) => {
                                              const newParams = { ...blueprint.customParams, [param]: e.target.value }
                                              updateBlueprintParams(blueprint.id, newParams)
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                                  <pre className="text-sm text-gray-100 font-mono">
                                    {blueprint.snippet.code.split('\n').slice(0, 5).join('\n')}
                                    {blueprint.snippet.code.split('\n').length > 5 && '\n...'}
                                  </pre>
                                </div>
                                {blueprint.snippet.parameters && blueprint.snippet.parameters.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {blueprint.snippet.parameters.map(param => (
                                      <Badge key={param} variant="secondary" className="text-xs">
                                        %{param}%
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Code Preview */}
              <TabsContent value="preview" className="h-[calc(100%-60px)]">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Generated Script Preview
                          {syntaxErrors.length > 0 ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : generatedScript ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : null}
                        </CardTitle>
                        <CardDescription>
                          Complete JavaScript code ready for use
                          {syntaxErrors.length > 0 && (
                            <span className="text-red-500 ml-2">
                              ({syntaxErrors.length} syntax warnings)
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      {generatedScript && (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button onClick={downloadScript}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {syntaxErrors.length > 0 && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Syntax Warnings:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {syntaxErrors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <ScrollArea className="h-[calc(100%-100px)]">
                      {generatedScript ? (
                        <div className="bg-gray-900 rounded-lg p-4">
                          <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                            {generatedScript}
                          </pre>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                          <Play className="h-12 w-12 mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No script generated yet</p>
                          <p className="text-sm text-center">
                            Add blueprints and click "Generate Script" to see your code
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}