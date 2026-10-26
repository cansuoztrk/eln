import { flatten, type DesignConfig } from '@/core/model/design';
import { DNA_BY_ID } from '@/core/model/dna';
import { DNA_LABEL, KEY_LABEL, prettyValue } from '@/core/model/labels';
import { evaluateRules } from '@/core/model/rules';

export function preferenceRows(d: DesignConfig) {
  return Object.entries(flatten(d))
    .filter(([k]) => k !== 'v' && !k.startsWith('show.sequence'))
    .map(([k, v]) => ({ key: k, label: KEY_LABEL[k] ?? k, value: prettyValue(k, v) }));
}

export function designSummary(d: DesignConfig, link?: string): string {
  const findings = evaluateRules(d);
  const lines = [
    '# ASLAN 2035 OMEGA — Tasarım özeti',
    '',
    '_Bağımsız konsept çalışması; Galatasaray SK tarafından onaylanmış resmî bir proje değildir._',
    '',
    `**Stadium DNA:** ${DNA_LABEL[d.dna]}${d.dna !== 'custom' ? ` — ${DNA_BY_ID[d.dna].tagline}` : ''}`,
    '',
    '## Tasarım tercihleri',
    ...preferenceRows(d).map((r) => `- ${r.label}: ${r.value}`),
    '',
    '## Uyum ve teknik notlar',
    ...(findings.length ? findings.map((f) => `- [${f.severity === 'engineering' ? 'Mühendislik' : f.severity === 'conflict' ? 'Çakışma' : 'Bilgi'}] ${f.title}`) : ['- Çakışma bulunmadı.']),
    '',
    '## Sınırlar',
    '- Görseller prosedürel bir konsept modelden üretilmiştir; ölçülmüş bir rölöve değildir.',
    '- Simülasyon etiketli değerler gerçek ölçüm değildir; maliyet tahmini yapılmamıştır.',
  ];
  if (link) lines.push('', `Paylaşım bağlantısı: ${link}`);
  return lines.join('\n');
}
