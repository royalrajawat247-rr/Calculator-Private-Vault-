import React, { useMemo } from 'react';
import type { TranslationDict } from '../i18n/translations';

interface AdsterraBannerSlotProps {
  t: TranslationDict;
}

export const AdsterraBannerSlot: React.FC<AdsterraBannerSlotProps> = ({ t }) => {
  const iframeSrcDoc = useMemo(() => {
    return [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=300, initial-scale=1.0" />',
      '<style>',
      '  html, body { margin: 0; padding: 0; width: 300px; height: 250px; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }',
      '</style>',
      '</head>',
      '<body>',
      '<script>',
      '  window.atOptions = {',
      "    'key' : '14ab84bb631fc528da7f4068bbf16386',",
      "    'format' : 'iframe',",
      "    'height' : 250,",
      "    'width' : 300,",
      "    'params' : {}",
      '  };',
      '</script>',
      '<script src="https://bicea.org/22/14ab84bb631fc528da7f4068bbf16386"></script>',
      '</body>',
      '</html>',
    ].join('\n');
  }, []);

  return (
    <div className="mt-2.5 flex flex-col items-center justify-center pb-1">
      <div
        id="adsterra-300x250-slot"
        data-adsterra-zone="300x250"
        className="w-[300px] h-[250px] rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/80 dark:bg-[#0F1626]/75 backdrop-blur-md shadow-2xs overflow-hidden flex items-center justify-center"
      >
        <iframe
          title="Adsterra 300x250 Banner"
          srcDoc={iframeSrcDoc}
          width={300}
          height={250}
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          className="w-[300px] h-[250px] border-0 block overflow-hidden"
        />
      </div>

      <p className="mt-1 text-center text-[9.5px] font-medium text-slate-500 dark:text-[#94A3B8]">
        {t.adSlot.caption}
      </p>
    </div>
  );
};
