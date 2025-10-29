import { useMemo, createElement, ReactNode, CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Convert CSS string to React style object
 * Handles kebab-case to camelCase conversion for CSS properties
 */
function parseStyleString(styleString: string): CSSProperties {
  const styles: Record<string, string> = {}
  
  // Split by semicolon and process each declaration
  styleString.split(';').forEach(declaration => {
    const [property, value] = declaration.split(':').map(s => s.trim())
    if (property && value) {
      // Convert kebab-case to camelCase (e.g., font-weight -> fontWeight)
      const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      styles[camelCaseProperty] = value
    }
  })
  
  return styles as CSSProperties
}

/**
 * Custom hook to safely render HTML tags in translation strings
 * Supports any HTML tags with class, style, and other attributes
 * 
 * Usage:
 * const content = useHtmlTranslation('myKey')
 * return <div>{content}</div>
 * 
 * Examples:
 * - "Text with <span class='text-red-500'>red text</span>"
 * - "Styled <div style='color: blue; font-weight: bold;'>content</div>"
 * - "Link to <a href='https://example.com' target='_blank'>website</a>"
 */
export function useHtmlTranslation(key: string, namespace?: string): ReactNode[] {
  const { t } = useTranslation(namespace)
  
  return useMemo(() => {
    const text = t(key)
    
    // Parse HTML tags and convert to React elements
    const parts = text.split(/(<[^>]+>.*?<\/[^>]+>|<[^>]+\/>)/g)
    
    return parts.map((part, index) => {
      // Check if this part is an HTML tag
      const tagMatch = part.match(/^<(\w+)([^>]*)>(.*?)<\/\1>$/)
      if (tagMatch) {
        const [, tagName, attributes, content] = tagMatch
        
        // Parse attributes (basic support for class, style, etc.)
        const attrs: Record<string, any> = {}
        const attrMatches = attributes.match(/(\w+)=["']([^"']+)["']/g)
        if (attrMatches) {
          attrMatches.forEach((attr: string) => {
            const [attrKey, value] = attr.split('=')
            attrs[attrKey] = value.replace(/["']/g, '')
          })
        }
        
        // Convert class to className for React
        if (attrs.class) {
          attrs.className = attrs.class
          delete attrs.class
        }
        
        // Convert style string to React style object
        if (attrs.style) {
          attrs.style = parseStyleString(attrs.style)
        }
        
        // Create React element using createElement
        return createElement(tagName, { key: index, ...attrs }, content)
      }
      
      // Check for self-closing tags
      const selfClosingMatch = part.match(/^<(\w+)([^>]*)\/>$/)
      if (selfClosingMatch) {
        const [, tagName, attributes] = selfClosingMatch
        
        const attrs: Record<string, any> = {}
        const attrMatches = attributes.match(/(\w+)=["']([^"']+)["']/g)
        if (attrMatches) {
          attrMatches.forEach((attr: string) => {
            const [attrKey, value] = attr.split('=')
            attrs[attrKey] = value.replace(/["']/g, '')
          })
        }
        
        if (attrs.class) {
          attrs.className = attrs.class
          delete attrs.class
        }
        
        // Convert style string to React style object
        if (attrs.style) {
          attrs.style = parseStyleString(attrs.style)
        }
        
        // Create React element using createElement
        return createElement(tagName, { key: index, ...attrs })
      }
      
      // Regular text
      return part
    })
  }, [t, key])
}
