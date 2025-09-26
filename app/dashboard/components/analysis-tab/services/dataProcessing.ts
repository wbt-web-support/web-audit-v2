import { CmsData, TechnologiesData, CmsPlugin, CmsTheme, CmsComponent, Technology } from '../types'

export function processCmsData(cmsData: Record<string, unknown> | null): CmsData {
  if (!cmsData) {
    return {
      cms_type: null,
      cms_version: null,
      cms_plugins: null,
      cms_themes: null,
      cms_components: null,
      cms_confidence: 0,
      cms_detection_method: null,
      cms_metadata: {}
    }
  }

  // Process plugins - remove duplicates and add metadata
  const uniquePlugins = (cmsData.plugins as CmsPlugin[] | undefined) ? 
    (cmsData.plugins as CmsPlugin[]).reduce((acc: CmsPlugin[], plugin: CmsPlugin) => {
      const existing = acc.find(p => p.name === plugin.name)
      if (!existing) {
        acc.push({
          name: plugin.name || 'Unknown Plugin',
          version: plugin.version || null,
          active: plugin.active !== false,
          path: plugin.path || null,
          description: plugin.description || null,
          author: plugin.author || null,
          confidence: plugin.confidence || 0.8,
          detection_method: plugin.detection_method || 'unknown'
        })
      } else {
        // Update existing plugin with higher confidence or more info
        if ((plugin.confidence || 0.8) > existing.confidence) {
          Object.assign(existing, {
            version: plugin.version || existing.version,
            active: plugin.active !== false ? plugin.active : existing.active,
            path: plugin.path || existing.path,
            description: plugin.description || existing.description,
            author: plugin.author || existing.author,
            confidence: plugin.confidence || existing.confidence,
            detection_method: plugin.detection_method || existing.detection_method
          })
        }
      }
      return acc
    }, []) : null

  // Process themes - remove duplicates and add metadata
  const uniqueThemes = (cmsData.themes as CmsTheme[] | undefined) ? 
    (cmsData.themes as CmsTheme[]).reduce((acc: CmsTheme[], theme: CmsTheme) => {
      const existing = acc.find(t => t.name === theme.name)
      if (!existing) {
        acc.push({
          name: theme.name || 'Unknown Theme',
          version: theme.version || null,
          active: theme.active !== false,
          path: theme.path || null,
          description: theme.description || null,
          author: theme.author || null,
          confidence: theme.confidence || 0.8,
          detection_method: theme.detection_method || 'unknown'
        })
      } else {
        // Update existing theme with higher confidence or more info
        if ((theme.confidence || 0.8) > existing.confidence) {
          Object.assign(existing, {
            version: theme.version || existing.version,
            active: theme.active !== false ? theme.active : existing.active,
            path: theme.path || existing.path,
            description: theme.description || existing.description,
            author: theme.author || existing.author,
            confidence: theme.confidence || existing.confidence,
            detection_method: theme.detection_method || existing.detection_method
          })
        }
      }
      return acc
    }, []) : null

  // Process components - remove duplicates and add metadata
  const uniqueComponents = (cmsData.components as CmsComponent[] | undefined) ? 
    (cmsData.components as CmsComponent[]).reduce((acc: CmsComponent[], component: CmsComponent) => {
      const existing = acc.find(c => c.name === component.name && c.type === component.type)
      if (!existing) {
        acc.push({
          name: component.name || 'Unknown Component',
          type: component.type || 'unknown',
          version: component.version || null,
          active: component.active !== false,
          path: component.path || null,
          description: component.description || null,
          confidence: component.confidence || 0.8,
          detection_method: component.detection_method || 'unknown'
        })
      } else {
        // Update existing component with higher confidence or more info
        if ((component.confidence || 0.8) > existing.confidence) {
          Object.assign(existing, {
            version: component.version || existing.version,
            active: component.active !== false ? component.active : existing.active,
            path: component.path || existing.path,
            description: component.description || existing.description,
            confidence: component.confidence || existing.confidence,
            detection_method: component.detection_method || existing.detection_method
          })
        }
      }
      return acc
    }, []) : null

  return {
    cms_type: (cmsData.type as string) || null,
    cms_version: (cmsData.version as string) || null,
    cms_plugins: uniquePlugins,
    cms_themes: uniqueThemes,
    cms_components: uniqueComponents,
    cms_confidence: (cmsData.confidence as number) || 0,
    cms_detection_method: (cmsData.detection_method as string) || null,
    cms_metadata: {
      detection_timestamp: new Date().toISOString(),
      total_plugins: uniquePlugins?.length || 0,
      total_themes: uniqueThemes?.length || 0,
      total_components: uniqueComponents?.length || 0,
      active_plugins: uniquePlugins?.filter((p: CmsPlugin) => p.active).length || 0,
      active_themes: uniqueThemes?.filter((t: CmsTheme) => t.active).length || 0,
      active_components: uniqueComponents?.filter((c: CmsComponent) => c.active).length || 0,
      ...(cmsData.metadata as Record<string, unknown> || {})
    }
  }
}

export function processTechnologiesData(technologiesData: unknown): TechnologiesData {
  if (!technologiesData || !Array.isArray(technologiesData)) {
    return {
      technologies: null,
      technologies_confidence: 0,
      technologies_detection_method: null,
      technologies_metadata: {}
    }
  }

  // Process technologies - handle both string arrays and object arrays
  const allTechnologies: Technology[] = []
  
  Array.from(technologiesData as unknown[]).forEach((tech: unknown) => {
    // Check if it's a string (simple technology name) or an object (detailed technology)
    if (typeof tech === 'string') {
      allTechnologies.push({
        name: tech,
        version: null,
        category: 'unknown',
        confidence: 0.9,
        detection_method: 'summary',
        description: null,
        website: null,
        icon: null,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      })
    } else if (typeof tech === 'object' && tech !== null) {
      // It's a detailed technology object - ensure it has required properties
      const techObj = tech as Technology
      allTechnologies.push({
        ...techObj,
        first_seen: techObj.first_seen || new Date().toISOString(),
        last_seen: techObj.last_seen || new Date().toISOString()
      })
    }
  })

  // Process technologies - remove duplicates and add metadata
  const uniqueTechnologies = allTechnologies.reduce((acc: Technology[], tech: Technology) => {
    const existing = acc.find(t => t.name === tech.name && t.category === (tech.category || 'unknown'))
    
    if (!existing) {
      acc.push({
        name: tech.name || 'Unknown Technology',
        version: tech.version || null,
        category: tech.category || 'unknown',
        confidence: tech.confidence || 0.8,
        detection_method: tech.detection_method || 'unknown',
        description: tech.description || null,
        website: tech.website || null,
        icon: tech.icon || null,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      })
    } else {
      // Update existing technology with higher confidence or more info
      if ((tech.confidence || 0.8) > existing.confidence) {
        Object.assign(existing, {
          version: tech.version || existing.version,
          confidence: tech.confidence || existing.confidence,
          detection_method: tech.detection_method || existing.detection_method,
          description: tech.description || existing.description,
          website: tech.website || existing.website,
          icon: tech.icon || existing.icon,
          last_seen: new Date().toISOString()
        })
      } else {
        // Update last_seen even if confidence is lower
        existing.last_seen = new Date().toISOString()
      }
    }
    return acc
  }, [])

  // Calculate overall confidence
  const overallConfidence = uniqueTechnologies.length > 0 
    ? uniqueTechnologies.reduce((sum, tech) => sum + tech.confidence, 0) / uniqueTechnologies.length
    : 0

  // Group technologies by category
  const technologiesByCategory = uniqueTechnologies.reduce((acc: Record<string, Technology[]>, tech: Technology) => {
    const category = tech.category || 'unknown'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(tech)
    return acc
  }, {})

  return {
    technologies: uniqueTechnologies,
    technologies_confidence: overallConfidence,
    technologies_detection_method: 'mixed', // Could be more specific based on detection methods
    technologies_metadata: {
      detection_timestamp: new Date().toISOString(),
      total_technologies: uniqueTechnologies.length,
      categories: Object.keys(technologiesByCategory),
      technologies_by_category: technologiesByCategory,
        high_confidence_technologies: uniqueTechnologies.filter((t: Technology) => t.confidence >= 0.8).length,
        medium_confidence_technologies: uniqueTechnologies.filter((t: Technology) => t.confidence >= 0.5 && t.confidence < 0.8).length,
        low_confidence_technologies: uniqueTechnologies.filter((t: Technology) => t.confidence < 0.5).length
    }
  }
}
