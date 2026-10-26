/**
 * Parameters the AI Architect may change, with their allowed values.
 * Kept in sync with src/core/model/design.ts (checked by tests/unit/server-schema.test.ts).
 */
export const PARAMETERS = {
  dna: ['classic', 'redgold', 'pure', 'future', 'green', 'custom'],
  language: ['heritage', 'iconic', 'minimal', 'futurist', 'organic'],
  'roof.form': ['current', 'halo', 'extended-canopy'],
  'roof.light': ['none', 'subtle-rim', 'halo-ring', 'segmented', 'full-crown'],
  'roof.ring': 'number 0..1',
  'facade.lighting': ['static', 'dynamic', 'media'],
  'materials.facade': ['brushed-metal', 'dark-metal', 'glass', 'composite', 'translucent', 'recycled', 'gold-metal'],
  'materials.roof': ['brushed-metal', 'dark-metal', 'composite', 'translucent', 'gold-metal'],
  'materials.structure': ['brushed-metal', 'dark-metal', 'concrete', 'recycled', 'gold-metal'],
  'materials.plinth': ['dark-metal', 'glass', 'concrete', 'recycled'],
  'screens.layout': ['standard', 'ribbon', 'extended', 'media-facade'],
  'seats.choreography': ['none', 'stripes', 'halves', 'wave', 'stars', 'mosaic-2035'],
  'palette.primary': 'hex colour #rrggbb',
  'palette.secondary': 'hex colour #rrggbb',
  'palette.night': ['istanbul-blue', 'crimson', 'amber', 'neutral', 'emerald'],
  'plaza.character': ['urban', 'park', 'event', 'garden'],
  'plaza.social': ['current', 'expanded'],
  'district.fanZone': 'true|false',
  'district.museum': 'true|false',
  'district.eventLawn': 'true|false',
  'district.transitHub': 'true|false',
  'district.meetingPoints': 'true|false',
  'green.solar': ['existing', 'extended'],
  'green.rainwater': 'true|false',
  'green.efficientLighting': 'true|false',
  'green.pitchCare': 'true|false',
  'green.landscape': 'true|false',
  'green.waste': 'true|false',
  'green.transitLink': 'true|false',
  'access.routes': 'true|false',
  'access.servicePoints': 'true|false',
  'show.active': 'true|false',
  'show.preset': ['arrival', 'red-wave', 'golden-halo', 'european-night', 'roar', 'championship', 'custom'],
  'show.primary': 'hex colour #rrggbb',
  'show.secondary': 'hex colour #rrggbb',
  'show.ring': 'number 0..1',
  'show.speed': 'number 0..1',
  'show.tribune': 'number 0..1',
  'show.led': ['off', 'colors', 'wave', 'text', 'match'],
  'show.profile': ['static', 'breathe', 'chase', 'wave', 'sparkle', 'split'],
};

const stringList = { type: 'array', items: { type: 'string' } };

export const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['understood', 'changes', 'explanation', 'unknowns', 'constraints', 'outOfScope'],
  properties: {
    understood: stringList,
    changes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'value', 'reason'],
        properties: {
          key: { type: 'string', enum: Object.keys(PARAMETERS) },
          value: { type: 'string' },
          reason: { type: 'string' },
        },
      },
    },
    explanation: stringList,
    unknowns: stringList,
    constraints: stringList,
    outOfScope: stringList,
  },
};
