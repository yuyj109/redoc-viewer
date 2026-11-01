import React, { useState, useMemo, useEffect } from 'react';
import { RedocStandalone } from 'redoc';
import yaml from 'js-yaml';
import mermaid from 'mermaid';
import './App.css';

const useQuery = () => {
  const { search } = window.location;
  return useMemo(() => new URLSearchParams(search), [search]);
};

let mermaidDiagramId = 0;

function renderMermaidInRedoc() {
  // Redoc内のmermaidコードブロックをSVGに変換
  const codeBlocks = document.querySelectorAll('pre[data-language="mermaid"], code.language-mermaid');
  codeBlocks.forEach(async (block) => {
    const parent = block.matches('pre') ? block : block.parentElement;
    if (!parent || parent.getAttribute('data-mermaid-rendered')) return;
    parent.setAttribute('data-mermaid-rendered', 'pending');
    const chart = block.textContent || '';
    try {
      // mermaid.renderはPromiseを返す（v10以降）
      const { svg } = await mermaid.render(`redoc-mermaid-${mermaidDiagramId++}`, chart);
      const wrapper = document.createElement('div');
      wrapper.innerHTML = svg;
      parent.replaceWith(wrapper);
    } catch (e) {
      parent.setAttribute('data-mermaid-rendered', 'error');
    }
  });
}

function App() {
  const query = useQuery();
  const url = query.get('url');
  const [file, setFile] = useState('');
  const [selectedName, setSelectedName] = useState('');

  const isJson = (str: string) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files) {
        const fileReader = new FileReader();
        fileReader.readAsText(e.target.files[0], 'UTF-8');
        setSelectedName(e.target.files[0].name);
        fileReader.onloadend = (readerEvent: ProgressEvent<FileReader>) => {
          if (readerEvent?.target?.result) {
            let result = readerEvent.target.result.toString();
            if (!isJson(result)) {
              result = JSON.stringify(yaml.load(result));
            }
            setFile(result);
          }
        };
      }
    } catch {
      setFile('');
      setSelectedName('');
    }
  };

  useEffect(() => {
    // Redoc の非同期描画やページ切り替えで追加された図も変換する
    const observer = new MutationObserver(renderMermaidInRedoc);
    observer.observe(document.body, { childList: true, subtree: true });
    renderMermaidInRedoc();
    return () => observer.disconnect();
  }, [file, url]);

  if (url && /https:\/\/.*\.[json|y?ml]/.test(url)) {
    return (
      <RedocStandalone
        specUrl={url}
        options={{
          disableTelemetry: true,
        }}
      />
    );
  }

  return (
    <div>
      <div className="app">
        <div className="parent">
          <div className="file-upload">
            <h3> {selectedName || 'Click box to upload'}</h3>
            <input type="file" onChange={handleChange} />
          </div>
        </div>
      </div>
      <br />
      {file !== '' && (
        <RedocStandalone
          spec={JSON.parse(file)}
          options={{
            disableTelemetry: true,
          }}
        />
      )}
    </div>
  );
}

export default App;
