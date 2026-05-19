import React from 'react';

export default function TemplateSelector({ templates, selectedTemplate, onSelect }) {
  return (
    <div className="selector-panel-compact">
      <div className="selector-header-compact">
        <h2 className="selector-title-compact">SELECT TEMPLATE</h2>
      </div>

      <div className="selector-pills">
        {templates.map((template, index) => {
          const isSelected = selectedTemplate === template.id;
          
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`selector-pill ${isSelected ? 'is-selected' : ''}`}
            >
              <span className="pill-radio"></span>
              <span className="pill-label">Template {index + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
