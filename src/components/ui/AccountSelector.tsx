import { Select, SelectItem } from "@heroui/react";

interface Option {
  label: string;
  value: string;
}

interface AccountSelectorProps {
  label: string;
  options: Option[];
  selected: number;
  setSelected: (value: number) => void;
}

export default function AccountSelector({ label, options, selected, setSelected }: AccountSelectorProps) {
  return (
    <Select
      label={label}
      selectedKeys={[options[selected]?.value || ""]}
      onSelectionChange={(keys) => {
        const selectedKey = Array.from(keys)[0] as string;
        const index = options.findIndex((opt) => opt.value === selectedKey);
        if (index !== -1) {
          setSelected(index);
        }
      }}
      className="w-full"
    >
      {options.map((option) => (
        <SelectItem key={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
}
