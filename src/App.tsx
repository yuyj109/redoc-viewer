import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RedocStandalone } from 'redoc';
import yaml from 'js-yaml';
import mermaid from 'mermaid';
import './App.css';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

function renderMermaidInRedoc() {
  // Redoc内のmermaidコードブロックをSVGに変換
  const codeBlocks = document.querySelectorAll('code.language-mermaid');
  codeBlocks.forEach(async (block, idx) => {
    const parent = block.parentElement;
    if (!parent || parent.getAttribute('data-mermaid-rendered')) return;
    const chart = block.textContent || '';
    try {
      // mermaid.renderはPromiseを返す（v10以降）
      const { svg } = await mermaid.render(`redoc-mermaid-${idx}`, chart);
      const wrapper = document.createElement('div');
      wrapper.innerHTML = svg;
      parent.replaceWith(wrapper);
      parent.setAttribute('data-mermaid-rendered', 'true');
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
    // Redoc描画後にMermaid変換を試みる
    setTimeout(renderMermaidInRedoc, 500);
  }, [file, url]);

  if (url && /https:\/\/.*\.[json|y?ml]/.test(url)) {
    return (
      <RedocStandalone
        specUrl={url}
        options={{
          nativeScrollbars: true,
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
            nativeScrollbars: true,
          }}
        />
      )}
    </div>
  );
}

export default App;
