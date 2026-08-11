import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import type { InsertMember } from '@theobase/shared';

const memberFormSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  baptismDate: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  membershipStatus: z.enum(['baptised', 'profession', 'transfer-in', 'transfer-out']),
});

type FormErrors = Partial<Record<keyof z.infer<typeof memberFormSchema>, string>>;

interface MemberFormProps {
  member?: Partial<InsertMember>;
  onSubmit: (data: InsertMember) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MemberForm({ member, onSubmit, onCancel, isLoading }: MemberFormProps) {
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState(member?.firstName ?? '');
  const [lastName, setLastName] = useState(member?.lastName ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [address, setAddress] = useState(member?.address ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(member?.dateOfBirth ?? '');
  const [baptismDate, setBaptismDate] = useState(member?.baptismDate ?? '');
  const [gender, setGender] = useState(member?.gender ?? '');
  const [membershipStatus, setMembershipStatus] = useState(
    member?.membershipStatus ?? 'baptised',
  );
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = { firstName, lastName, email, phone, address, dateOfBirth, baptismDate, gender, membershipStatus };
    const result = memberFormSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    const data = {
      ...(member?.id ? { id: member.id } : {}),
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      address: address || null,
      dateOfBirth: dateOfBirth || null,
      baptismDate: baptismDate || null,
      gender: (gender || null) as InsertMember['gender'],
      membershipStatus: membershipStatus as InsertMember['membershipStatus'],
    } as InsertMember;
    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('member.firstName')}</span>
          <Input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
          )}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('member.lastName')}</span>
          <Input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
          )}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('member.email')}</span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('member.phone')}</span>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('member.address')}</span>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('member.dateOfBirth')}</span>
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('member.baptismDate')}</span>
          <Input
            type="date"
            value={baptismDate}
            onChange={(e) => setBaptismDate(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('member.gender')}</span>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue placeholder={t('member.gender')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t('member.male')}</SelectItem>
              <SelectItem value="female">{t('member.female')}</SelectItem>
              <SelectItem value="other">{t('member.other')}</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('member.status')}</span>
          <Select value={membershipStatus} onValueChange={(v) => setMembershipStatus(v as typeof membershipStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baptised">baptised</SelectItem>
              <SelectItem value="profession">profession</SelectItem>
              <SelectItem value="transfer-in">transfer-in</SelectItem>
              <SelectItem value="transfer-out">transfer-out</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('member.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '...' : t('member.save')}
        </Button>
      </div>
    </form>
  );
}
