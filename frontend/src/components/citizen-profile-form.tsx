"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_PROFILE,
  OCCUPATION_OPTIONS,
  type CitizenProfile,
  type Occupation,
} from "@/lib/types";
import { formatInr } from "@/lib/utils";

interface CitizenProfileFormProps {
  profile: CitizenProfile;
  onChange: (profile: CitizenProfile) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

function ExclusionSwitch({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-3">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function CitizenProfileForm({
  profile,
  onChange,
  onSubmit,
  isLoading,
}: CitizenProfileFormProps) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Citizen Profile</CardTitle>
        <CardDescription>
          Central schemes (PM-KISAN, PM Vishwakarma) — control-only inputs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="age-slider">Age</Label>
            <span className="text-sm font-medium">{profile.age} years</span>
          </div>
          <Slider
            id="age-slider"
            min={18}
            max={80}
            step={1}
            value={[profile.age]}
            onValueChange={([value]) => onChange({ ...profile, age: value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Occupation</Label>
          <Select
            value={profile.occupation}
            onValueChange={(value) =>
              onChange({ ...profile, occupation: value as Occupation })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select occupation" />
            </SelectTrigger>
            <SelectContent>
              {OCCUPATION_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="land-slider">Land Holding</Label>
            <span className="text-sm font-medium">
              {profile.land_holding_acres.toFixed(1)} acres
            </span>
          </div>
          <Slider
            id="land-slider"
            min={0}
            max={10}
            step={0.5}
            value={[profile.land_holding_acres]}
            onValueChange={([value]) =>
              onChange({ ...profile, land_holding_acres: value })
            }
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="pension-slider">Monthly Pension</Label>
            <span className="text-sm font-medium">
              {formatInr(profile.monthly_pension)}
            </span>
          </div>
          <Slider
            id="pension-slider"
            min={0}
            max={50_000}
            step={500}
            value={[profile.monthly_pension]}
            onValueChange={([value]) =>
              onChange({ ...profile, monthly_pension: value })
            }
          />
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Exclusion Checks</h3>
            <p className="text-xs text-muted-foreground">
              PM-KISAN and PM Vishwakarma exclusion criteria from operational
              guidelines.
            </p>
          </div>
          <div className="space-y-2">
            <ExclusionSwitch
              id="institutional-landholder"
              label="Institutional Landholder"
              description="Land held by institution, trust, or company."
              checked={profile.is_institutional_landholder}
              onCheckedChange={(checked) =>
                onChange({ ...profile, is_institutional_landholder: checked })
              }
            />
            <ExclusionSwitch
              id="income-tax-payer"
              label="Income Tax Payer"
              description="Registered income tax assessee."
              checked={profile.is_income_tax_payer}
              onCheckedChange={(checked) =>
                onChange({ ...profile, is_income_tax_payer: checked })
              }
            />
            <ExclusionSwitch
              id="govt-professional"
              label="Govt / Professional Status"
              description="Government employee or registered professional."
              checked={profile.is_govt_employee_or_professional}
              onCheckedChange={(checked) =>
                onChange({
                  ...profile,
                  is_govt_employee_or_professional: checked,
                })
              }
            />
            <ExclusionSwitch
              id="active-business-loan"
              label="Active Business Loan"
              description="Has an active government business loan."
              checked={profile.has_active_govt_business_loan}
              onCheckedChange={(checked) =>
                onChange({ ...profile, has_active_govt_business_loan: checked })
              }
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Checking…" : "Check Eligibility"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange(DEFAULT_PROFILE)}
            disabled={isLoading}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
