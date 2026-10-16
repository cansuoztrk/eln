import { registerPlugin } from '@capacitor/core';
import { EXAMS } from '../core/exams';
import { t } from '../i18n';
import { examTarget } from '../meta/actions';
import { profile } from '../meta/state';
import { platform } from './platform';

/**
 * Home-screen countdown widget bridge. The Android app ships a native
 * AppWidget (CountdownWidget.java) that reads this JSON and redraws itself;
 * `LaleWidget.update` asks it to refresh right away. iOS WidgetKit is v1.1.
 */
interface LaleWidgetPlugin {
  update(options: { json: string }): Promise<void>;
}

const LaleWidget = registerPlugin<LaleWidgetPlugin>('LaleWidget');

export async function updateWidget(): Promise<void> {
  if (platform !== 'android') return;
  const target = examTarget();
  const exam = EXAMS[profile().exam].short;
  const json = JSON.stringify({
    exam,
    label: t('widget.label', { exam }),
    days: t('widget.days'),
    // Midnight of the exam day, so the widget can recompute days left on its own.
    at: target ? new Date(target.at.getFullYear(), target.at.getMonth(), target.at.getDate()).getTime() : 0,
  });
  try {
    await LaleWidget.update({ json });
  } catch {
    /* widget plugin not available (web / older build) */
  }
}
