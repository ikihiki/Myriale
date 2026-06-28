import { MyrialeSelect } from '../../ui/MyrialeRadix';

export function SelectField({ label, value, onChange, options, help, testId }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; help?: string; testId?: string }) {
  return <MyrialeSelect label={label} value={value} onValueChange={onChange} options={options} help={help} testId={testId} />;
}
