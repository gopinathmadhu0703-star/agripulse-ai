import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { exportToCSV } from './csvExport'

// Mock DOM methods
beforeEach(() => {
  const mockClick = vi.fn()
  const mockAppend = vi.fn()
  const mockRemove = vi.fn()
  const mockRevoke = vi.fn()

  vi.stubGlobal('URL', {
    createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
    revokeObjectURL: mockRevoke,
  })

  // Properly mock Blob constructor
  const mockBlobConstructor = vi.fn().mockImplementation((parts, options) => ({
    size: parts.join('').length,
    type: options?.type || '',
  }))
  vi.stubGlobal('Blob', mockBlobConstructor)

  Object.defineProperty(document, 'createElement', {
    value: vi.fn().mockReturnValue({
      click: mockClick,
      href: '',
      download: '',
      style: {},
    }),
    writable: true,
  })
  Object.defineProperty(document.body, 'appendChild', {
    value: mockAppend,
    writable: true,
  })
  Object.defineProperty(document.body, 'removeChild', {
    value: mockRemove,
    writable: true,
  })
})

describe('exportToCSV', () => {
  it('does nothing when rows is empty', () => {
    exportToCSV([], 'test.csv')
    expect(globalThis.Blob).not.toHaveBeenCalled()
  })

  it('creates a Blob with header row + data rows', () => {
    const rows = [
      { name: 'Alice', value: 42 },
      { name: 'Bob', value: 100 },
    ]
    
    exportToCSV(rows, 'test.csv')
    
    // Check that Blob was called
    expect(globalThis.Blob).toHaveBeenCalled()
    
    // Get the actual call arguments
    const blobCall = (globalThis.Blob as Mock).mock.calls[0]
    const blobContent = blobCall[0][0] as string
    
    expect(blobContent).toContain('name,value')
    expect(blobContent).toContain('Alice,42')
    expect(blobContent).toContain('Bob,100')
  })

  it('wraps values containing commas in quotes', () => {
    const rows = [{ location: 'London, UK', count: 5 }]
    
    exportToCSV(rows, 'test.csv')
    
    const blobCall = (globalThis.Blob as Mock).mock.calls[0]
    const blobContent = blobCall[0][0] as string
    
    expect(blobContent).toContain('"London, UK"')
  })
})