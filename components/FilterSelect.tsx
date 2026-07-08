"use client";

type FilterSelectProps = {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  formatOption?: (value: string) => string;
  onChange: (value: string) => void;
};

export function FilterSelect({ label, value, options, placeholder, formatOption, onChange }: FilterSelectProps) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption ? formatOption(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}
