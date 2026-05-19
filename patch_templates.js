const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'templates', 'ElectricBillTemplates.jsx');
let c = fs.readFileSync(filePath, 'utf8');

const utilitySpecificSections = `
        {/* Custom Header & Labels */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Custom Header & Labels</div>
          <div className="compact-form-grid">
            <div className="compact-form-field full-width">
              <label className="compact-form-label">Bill Title</label>
              <input type="text" name="billTitle" value={formData.billTitle} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Company Name</label>
              <input type="text" name="boardName" value={formData.boardName} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Company Address</label>
              <textarea name="boardAddress" value={formData.boardAddress} onChange={handleInputChange} className="compact-form-input" rows="2" />
            </div>
             <div className="compact-form-field">
              <label className="compact-form-label">Footer URL/Text</label>
              <input type="text" name="footerUrl" value={formData.footerUrl} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Utility Statement Dates */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Utility Statement Dates</div>
          <div className="compact-form-grid">
            <div className="compact-form-field">
              <label className="compact-form-label">Statement Date</label>
              <input type="date" name="statementDate" value={formData.statementDate} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Period From</label>
              <input type="date" name="periodFrom" value={formData.periodFrom} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Period Until</label>
              <input type="date" name="periodTo" value={formData.periodTo} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Usage Details */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Usage Details</div>
          <div className="compact-form-grid cols-3">
            <div className="compact-form-field">
              <label className="compact-form-label">Usage (kWh)</label>
              <input type="number" name="usageKwh" value={formData.usageKwh} onChange={handleInputChange} className="compact-form-input" />
            </div>
            <div className="compact-form-field">
              <label className="compact-form-label">Cost per kWh</label>
              <input type="number" step="0.01" name="costPerKwh" value={formData.costPerKwh} onChange={handleInputChange} className="compact-form-input" />
            </div>
             <div className="compact-form-field">
              <label className="compact-form-label">Previous Charges ($)</label>
              <input type="number" step="0.01" name="previousCharges" value={formData.previousCharges} onChange={handleInputChange} className="compact-form-input" />
            </div>
          </div>
        </div>

        {/* Bill Reminders */}
        <div className="compact-form-section">
          <div className="compact-form-section-title">Bill Reminders</div>
          {formData.reminders.map((reminder, index) => (
            <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
              <input 
                type="text" 
                value={reminder} 
                onChange={(e) => handleReminderChange(index, e.target.value)} 
                className="compact-form-input" 
                style={{ flex: 1 }}
              />
              <button onClick={() => removeReminder(index)} className="remove-btn" style={{ padding: '0 8px', color: '#ef4444' }}></button>
            </div>
          ))}
          <button onClick={addReminder} className="add-item-btn" style={{ marginTop: '5px', fontSize: '0.75rem' }}>+ Add Reminder</button>
        </div>
`;

// Insert the new sections right after the TemplateSelector
c = c.replace(/<TemplateSelector[\s\S]*?\/>/, (match) => match + utilitySpecificSections);

fs.writeFileSync(filePath, c);
console.log('Added utility sections to ElectricBillTemplates.jsx successfully');
