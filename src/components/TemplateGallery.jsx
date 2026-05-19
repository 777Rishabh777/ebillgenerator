import React, { useEffect, useState } from 'react';
import InvoiceTemplates from './templates/InvoiceTemplates';
import GeneralBillTemplates from './templates/GeneralBillTemplates';
import FuelBillTemplates from './templates/FuelBillTemplates';
import RestaurantBillTemplates from './templates/RestaurantBillTemplates';
import DriverSalaryTemplates from './templates/DriverSalaryTemplates';
import DailyHelperTemplates from './templates/DailyHelperTemplates';
import RentReceiptTemplates from './templates/RentReceiptTemplates';
import LTAReceiptTemplates from './templates/LTAReceiptTemplates';
import MedicalBillTemplates from './templates/MedicalBillTemplates';
import InternetBillTemplates from './templates/InternetBillTemplates';
import ElectricBillTemplates from './templates/ElectricBillTemplates';
import CabTravelTemplates from './templates/CabTravelTemplates';
// import Logo from '../images/ebillgenerator_stylish.svg';

const billTypes = [
  {
    id: 'invoice',
    label: 'Invoice Generator',
    chipLabel: 'Invoice',
    iconColor: 'text-blue-500',
    iconPaths: [
      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    ],
    component: InvoiceTemplates
  },
  {
    id: 'general',
    label: 'General Bill',
    chipLabel: 'General',
    iconColor: 'text-slate-400',
    iconPaths: [
      'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
    ],
    component: GeneralBillTemplates
  },
  {
    id: 'fuel',
    label: 'Fuel Bill',
    chipLabel: 'Fuel',
    iconColor: 'text-orange-500',
    iconPaths: [
      'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'M15.5 12h.5a2 2 0 012 2v3a2 2 0 01-2 2h-4a2 2 0 01-2-2v-3a2 2 0 012-2h.5m3 0V7a3 3 0 00-3-3h-1m1 3h3'
    ],
    component: FuelBillTemplates
  },
  {
    id: 'electric',
    label: 'Electric Bill',
    chipLabel: 'Electric',
    iconColor: 'text-yellow-500',
    iconPaths: [
      'M13 10V3L4 14h7v7l9-11h-7z'
    ],
    component: ElectricBillTemplates
  },
  {
    id: 'restaurant',
    label: 'Restaurant Bill',
    chipLabel: 'Restaurant',
    iconColor: 'text-red-500',
    iconPaths: [
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    ],
    component: RestaurantBillTemplates
  },
  {
    id: 'salary',
    label: 'Driver Salary',
    chipLabel: 'Driver',
    iconColor: 'text-emerald-500',
    iconPaths: ['M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'],
    component: DriverSalaryTemplates
  },
  {
    id: 'helper',
    label: 'Daily Helper Bill',
    chipLabel: 'Helper',
    iconColor: 'text-yellow-500',
    iconPaths: [
      'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
    ],
    component: DailyHelperTemplates
  },
  {
    id: 'rent',
    label: 'Rent Receipt',
    chipLabel: 'Rent',
    iconColor: 'text-indigo-500',
    iconPaths: [
      'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    ],
    component: RentReceiptTemplates
  },
  {
    id: 'lta',
    label: 'LTA Receipt',
    chipLabel: 'LTA',
    iconColor: 'text-sky-500',
    iconPaths: ['M12 19l9 2-9-18-9 18 9-2zm0 0v-8'],
    component: LTAReceiptTemplates
  },
  {
    id: 'medical',
    label: 'Medical Bill',
    chipLabel: 'Medical',
    iconColor: 'text-rose-500',
    iconPaths: [
      'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
    ],
    component: MedicalBillTemplates
  },
  {
    id: 'internet',
    label: 'Internet Bill',
    chipLabel: 'Internet',
    iconColor: 'text-cyan-500',
    iconPaths: [
      'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
    ],
    component: InternetBillTemplates
  },
  {
    id: 'cab',
    label: 'Cab & Travel Bill',
    chipLabel: 'Cab',
    iconColor: 'text-green-500',
    iconPaths: [
      'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
    ],
    component: CabTravelTemplates
  }
];

function parseStoredJSON(rawValue) {
  try {
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function getStoredUser() {
  return parseStoredJSON(localStorage.getItem('billgen_user'));
}

function hasProAccess(userInput) {
  const user = userInput || getStoredUser() || {};

  const planCandidates = [
    user.plan,
    user.subscription,
    user.tier,
    user.package,
    localStorage.getItem('billgen_plan'),
    localStorage.getItem('billgen_subscription_tier')
  ];

  const hasProPlan = planCandidates.some((value) => {
    if (typeof value !== 'string') return false;
    const normalized = value.toLowerCase();
    return normalized === 'pro' || normalized === 'premium' || normalized === 'business' || normalized === 'enterprise';
  });

  const credits = Number(user.credits);
  const hasCredits = Number.isFinite(credits) ? credits > 0 : false;
  return hasProPlan && hasCredits;
}

function getInitialBillType() {
  const params = new URLSearchParams(window.location.search);
  const requested = (params.get('bill') || '').toLowerCase();
  const exists = billTypes.some((billType) => billType.id === requested);
  return exists ? requested : 'invoice';
}

export default function TemplateGallery() {
  const [selectedBillType, setSelectedBillType] = useState(getInitialBillType);
  const [isProUser, setIsProUser] = useState(() => hasProAccess(getStoredUser()));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('bill', selectedBillType);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [selectedBillType]);

  useEffect(() => {
    const syncSessionState = () => {
      const user = getStoredUser();
      setIsProUser(hasProAccess(user));
    };

    syncSessionState();
    window.addEventListener('storage', syncSessionState);
    window.addEventListener('focus', syncSessionState);
    return () => {
      window.removeEventListener('storage', syncSessionState);
      window.removeEventListener('focus', syncSessionState);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('billgen-pro-user', isProUser);
    return () => {
      document.body.classList.remove('billgen-pro-user');
    };
  }, [isProUser]);

  const handleTabClick = (id) => {
    if (id === selectedBillType) return;
    if (window.BillGenUI && window.BillGenUI.showLoader) {
      window.BillGenUI.showLoader('Loading...');
      setTimeout(() => {
        setSelectedBillType(id);
        setTimeout(() => {
          if (window.BillGenUI && window.BillGenUI.hideLoader) {
            window.BillGenUI.hideLoader();
          }
        }, 300);
      }, 30);
    } else {
      setSelectedBillType(id);
    }
  };

  const currentBillType = billTypes.find((bt) => bt.id === selectedBillType) || billTypes[0];
  const CurrentComponent = currentBillType.component;

  return (
    <div className="billgen-template-root">
      {/* Compact top bar with tabs */}
      <div className="billgen-topbar">
        <div className="billgen-topbar-inner">
          <div className="billgen-topbar-left">
            <h1 className="billgen-topbar-title">
              {currentBillType.chipLabel} <span>Templates</span>
            </h1>
            <div className={`billgen-plan-badge ${isProUser ? 'is-pro' : ''}`}>
              <span className="billgen-plan-dot"></span>
              {isProUser ? 'PRO' : 'FREE'}
            </div>
          </div>
          <div className="billgen-tab-strip">
            {billTypes.map((billType) => (
              <button
                key={billType.id}
                onClick={() => handleTabClick(billType.id)}
                className={`billgen-tab ${selectedBillType === billType.id ? 'is-active' : ''}`}
              >
                {billType.chipLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template workspace: form + preview in 100vh */}
      <div className="billgen-workspace">
        <CurrentComponent />
      </div>
    </div>
  );
}
