import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

export default function PlatformConfig() {
  const [formData, setFormData] = useState({
    basePrice: "₹5.00",
    minPrice: "₹2.50",
    maxPrice: "₹15.00",
    platformCommission: "2.5%",
    minWalletTopup: "₹100.00",
    maxWalletTopup: "₹1,00,000.00",
    minCreditsToRedeem: "100 kWh",
    creditConversionRate: "₹0.50",
    maxDailyTransactions: "100",
    maxDailyTransferAmount: "₹5,00,000",
    signupBonusCredits: "50 kWh",
    referralRewardRate: "5%",
    walletWithdrawalFee: "₹5.00 + 0.5%",
    transferFee: "0.75%",
    instantTransferFee: "1.5%",
    reversalFee: "₹25.00",
    businessHoursStart: "00:00",
    businessHoursEnd: "23:59",
    maintenanceWindowStart: "02:00",
    maintenanceWindowEnd: "04:00",
  });

  const BACKEND = (typeof window !== 'undefined' && (window as any).__POWERFLOW_API__)
    || (import.meta as any).env?.VITE_BACKEND_BASE_URL
    || 'http://localhost:4000';

  const fmtCurrency = (n: number) => `₹${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPercent = (n: number) => `${n}%`;
  const fmtKwh = (n: number) => `${n} kWh`;
  const parseNumber = (s: string) => Number(String(s).replace(/[^0-9.]/g, '')) || 0;

  useEffect(() => {
    const token = localStorage.getItem('powerflow.token') || '';
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/admin/config`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const cfg = await res.json();
        if (!res.ok) throw new Error(cfg?.message || 'Failed to load');
        setFormData({
          basePrice: fmtCurrency(cfg.pricing?.basePricePerKwh ?? 0),
          minPrice: fmtCurrency(cfg.pricing?.minPricePerKwh ?? 0),
          maxPrice: fmtCurrency(cfg.pricing?.maxPricePerKwh ?? 0),
          platformCommission: fmtPercent(cfg.pricing?.platformCommission ?? 0),
          minWalletTopup: fmtCurrency(cfg.transactionLimits?.minWalletTopup ?? 0),
          maxWalletTopup: fmtCurrency(cfg.transactionLimits?.maxWalletTopup ?? 0),
          maxDailyTransactions: String(cfg.transactionLimits?.maxDailyTransactions ?? 0),
          maxDailyTransferAmount: fmtCurrency(cfg.transactionLimits?.maxDailyTransferAmount ?? 0),
          minCreditsToRedeem: fmtKwh(cfg.creditsAndRewards?.minCreditsToRedeem ?? 0),
          creditConversionRate: fmtCurrency(cfg.creditsAndRewards?.creditConversionRate ?? 0),
          signupBonusCredits: fmtKwh(cfg.creditsAndRewards?.signupBonusCredits ?? 0),
          referralRewardRate: fmtPercent(cfg.creditsAndRewards?.referralRewardRate ?? 0),
          walletWithdrawalFee: fmtCurrency(cfg.fees?.walletWithdrawalFee ?? 0),
          transferFee: fmtPercent(cfg.fees?.transferFee ?? 0),
          instantTransferFee: fmtPercent(cfg.fees?.instantTransferFee ?? 0),
          reversalFee: fmtCurrency(cfg.fees?.reversalFee ?? 0),
          businessHoursStart: cfg.operationalHours?.businessHoursStart ?? '00:00',
          businessHoursEnd: cfg.operationalHours?.businessHoursEnd ?? '23:59',
          maintenanceWindowStart: cfg.operationalHours?.maintenanceWindowStart ?? '02:00',
          maintenanceWindowEnd: cfg.operationalHours?.maintenanceWindowEnd ?? '04:00',
        });
      } catch {}
    };
    load();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const ConfigSection = ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-6">{description}</p>
      {children}
    </div>
  );

  const ConfigField = ({
    label,
    name,
    value,
    description,
  }: {
    label: string;
    name: string;
    value: string;
    description?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input
        name={name}
        value={value}
        onChange={handleChange}
        className="bg-white/5 border-border"
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );

  const save = async () => {
    const token = localStorage.getItem('powerflow.token') || '';
    const payload = {
      pricing: {
        basePricePerKwh: parseNumber(formData.basePrice),
        minPricePerKwh: parseNumber(formData.minPrice),
        maxPricePerKwh: parseNumber(formData.maxPrice),
        platformCommission: parseNumber(formData.platformCommission),
      },
      transactionLimits: {
        minWalletTopup: parseNumber(formData.minWalletTopup),
        maxWalletTopup: parseNumber(formData.maxWalletTopup),
        maxDailyTransactions: parseNumber(formData.maxDailyTransactions),
        maxDailyTransferAmount: parseNumber(formData.maxDailyTransferAmount),
      },
      creditsAndRewards: {
        minCreditsToRedeem: parseNumber(formData.minCreditsToRedeem),
        creditConversionRate: parseNumber(formData.creditConversionRate),
        signupBonusCredits: parseNumber(formData.signupBonusCredits),
        referralRewardRate: parseNumber(formData.referralRewardRate),
      },
      fees: {
        walletWithdrawalFee: parseNumber(formData.walletWithdrawalFee),
        transferFee: parseNumber(formData.transferFee),
        instantTransferFee: parseNumber(formData.instantTransferFee),
        reversalFee: parseNumber(formData.reversalFee),
      },
      operationalHours: {
        businessHoursStart: formData.businessHoursStart,
        businessHoursEnd: formData.businessHoursEnd,
        maintenanceWindowStart: formData.maintenanceWindowStart,
        maintenanceWindowEnd: formData.maintenanceWindowEnd,
      },
    } as any;
    try {
      await fetch(`${BACKEND}/api/admin/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Platform Configuration
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configure pricing, transaction limits, and platform settings
          </p>
        </div>
        <Button onClick={save} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2 w-fit">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {/* Pricing Configuration */}
      <ConfigSection
        title="Pricing Configuration"
        description="Set energy pricing parameters and rates"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConfigField
            label="Base Price per kWh"
            name="basePrice"
            value={formData.basePrice}
            description="Default energy price"
          />
          <ConfigField
            label="Minimum Price per kWh"
            name="minPrice"
            value={formData.minPrice}
            description="Lowest allowed price"
          />
          <ConfigField
            label="Maximum Price per kWh"
            name="maxPrice"
            value={formData.maxPrice}
            description="Highest allowed price"
          />
          <ConfigField
            label="Platform Commission"
            name="platformCommission"
            value={formData.platformCommission}
            description="Commission percentage per transaction"
          />
        </div>
      </ConfigSection>

      {/* Transaction Limits */}
      <ConfigSection
        title="Transaction Limits"
        description="Configure wallet and transaction constraints"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConfigField
            label="Min Wallet Top-up"
            name="minWalletTopup"
            value={formData.minWalletTopup}
            description="Minimum amount for wallet recharge"
          />
          <ConfigField
            label="Max Wallet Top-up"
            name="maxWalletTopup"
            value={formData.maxWalletTopup}
            description="Maximum amount for wallet recharge"
          />
          <ConfigField
            label="Max Daily Transactions"
            name="maxDailyTransactions"
            value={formData.maxDailyTransactions}
            description="Number of transactions allowed"
          />
          <ConfigField
            label="Max Daily Transfer Amount"
            name="maxDailyTransferAmount"
            value={formData.maxDailyTransferAmount}
            description="Maximum transfer amount per day"
          />
        </div>
      </ConfigSection>

      {/* Credits and Rewards */}
      <ConfigSection
        title="Credits and Rewards"
        description="Configure energy credits redemption and reward parameters"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConfigField
            label="Min Credits to Redeem"
            name="minCreditsToRedeem"
            value={formData.minCreditsToRedeem}
            description="Minimum energy credits for redemption"
          />
          <ConfigField
            label="Credit Conversion Rate"
            name="creditConversionRate"
            value={formData.creditConversionRate}
            description="Rate per kWh to INR conversion"
          />
          <ConfigField label="Sign-up Bonus Credits" name="signupBonusCredits" value={formData.signupBonusCredits} description="Credits awarded on registration" />
          <ConfigField label="Referral Reward Rate" name="referralRewardRate" value={formData.referralRewardRate} description="Reward for successful referral" />
        </div>
      </ConfigSection>

      {/* Fee Structure */}
      <ConfigSection
        title="Fee Structure"
        description="Configure various platform fees"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConfigField label="Wallet Withdrawal Fee" name="walletWithdrawalFee" value={formData.walletWithdrawalFee} description="Fee charged on wallet withdrawal" />
          <ConfigField label="Transfer Fee" name="transferFee" value={formData.transferFee} description="Fee for energy transfer" />
          <ConfigField label="Instant Transfer Fee" name="instantTransferFee" value={formData.instantTransferFee} description="Premium fee for instant transfer" />
          <ConfigField label="Reversal Fee" name="reversalFee" value={formData.reversalFee} description="Fee for transaction reversal" />
        </div>
      </ConfigSection>

      {/* Business Hours and Maintenance */}
      <ConfigSection
        title="Business Hours & Maintenance"
        description="Configure platform availability and maintenance windows"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Business Hours Start
            </label>
            <Input name="businessHoursStart" type="time" className="bg-white/5 border-border" value={formData.businessHoursStart} onChange={handleChange} />
            <p className="text-xs text-muted-foreground">
              Daily platform opening time
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Business Hours End
            </label>
            <Input name="businessHoursEnd" type="time" className="bg-white/5 border-border" value={formData.businessHoursEnd} onChange={handleChange} />
            <p className="text-xs text-muted-foreground">
              Daily platform closing time
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Maintenance Window Start
            </label>
            <Input name="maintenanceWindowStart" type="time" className="bg-white/5 border-border" value={formData.maintenanceWindowStart} onChange={handleChange} />
            <p className="text-xs text-muted-foreground">
              When maintenance can begin
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Maintenance Window End
            </label>
            <Input name="maintenanceWindowEnd" type="time" className="bg-white/5 border-border" value={formData.maintenanceWindowEnd} onChange={handleChange} />
            <p className="text-xs text-muted-foreground">
              When maintenance must complete
            </p>
          </div>
        </div>
      </ConfigSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={save} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
