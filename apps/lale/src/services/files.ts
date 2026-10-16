import { isNative } from './platform';

/**
 * Saving and sharing files: backups (JSON) and parent/coach reports (CSV).
 * Native: written to the cache directory, then handed to the share sheet.
 * Web: a download link.
 */
export async function shareFile(name: string, content: string, mime: string): Promise<boolean> {
  try {
    if (isNative) {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const res = await Filesystem.writeFile({ path: name, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: name, files: [res.uri] });
      return true;
    }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return true;
  } catch {
    return false;
  }
}

/** Lets the user pick a text file (backup import). */
export function pickTextFile(accept = 'application/json,.json'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ''));
      r.onerror = () => resolve(null);
      r.readAsText(f);
    };
    input.click();
  });
}

export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (isNative) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text });
      return 'shared';
    }
    if (navigator.share) {
      await navigator.share({ text });
      return 'shared';
    }
  } catch {
    /* fall through to copy */
  }
  return (await copyText(text)) ? 'copied' : 'failed';
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
