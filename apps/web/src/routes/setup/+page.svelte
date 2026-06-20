<script lang="ts">
  import { goto } from "$app/navigation";
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Label } from "$lib/components/ui/label";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import StepIndicator from "$lib/components/StepIndicator.svelte";
  import FormField from "$lib/components/FormField.svelte";
  import Celebration from "$lib/components/Celebration.svelte";
  import { ArrowRight, ArrowLeft, Check, Plus, X } from "@lucide/svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";

  const STEPS = ["Church Details", "Member Import", "Department Rosters", "Bank Account", "Invite Officers"];

  let currentStep = $state(0);
  let stepError = $state("");
  let showCelebration = $state(false);

  let churchName = $state("");
  let address = $state("");
  let conference = $state("");
  let timezone = $state("");

  let csvContent = $state("");

  let selectedDepartments = $state<string[]>([]);
  const DEPARTMENT_OPTIONS = [
    "Pathfinders",
    "Sabbath School",
    "Dorcas/Welfare",
    "Health Ministry",
    "AV Team",
    "Facilities",
  ];

  let bankName = $state("");
  let accountName = $state("");
  let accountNumber = $state("");

  let officerEmail = $state("");
  let officerRole = $state("Clerk");
  let pendingInvites = $state<{ email: string; role: string }[]>([]);
  let removeInviteTarget = $state<number | null>(null);

  const completed = $derived(Array.from({ length: currentStep }, (_, i) => i));
  const isLastStep = $derived(currentStep === STEPS.length - 1);

  function validateStep(): boolean {
    stepError = "";
    if (currentStep === 0 && !churchName.trim()) {
      stepError = "Church Name is required.";
      return false;
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    if (isLastStep) {
      showCelebration = true;
      setTimeout(() => goto("/dashboard"), 300);
      return;
    }
    stepError = "";
    currentStep++;
  }

  function back() {
    stepError = "";
    if (currentStep > 0) currentStep--;
  }

  function skipStep() {
    stepError = "";
    currentStep++;
  }

  function toggleDepartment(dept: string) {
    if (selectedDepartments.includes(dept)) {
      selectedDepartments = selectedDepartments.filter((d) => d !== dept);
    } else {
      selectedDepartments = [...selectedDepartments, dept];
    }
  }

  function addInvite() {
    if (!officerEmail.trim()) return;
    pendingInvites = [...pendingInvites, { email: officerEmail.trim(), role: officerRole }];
    officerEmail = "";
    officerRole = "Clerk";
  }

  function removeInvite(index: number) {
    removeInviteTarget = index;
  }

  function confirmRemoveInvite() {
    if (removeInviteTarget === null) return;
    pendingInvites = pendingInvites.filter((_, i) => i !== removeInviteTarget);
    removeInviteTarget = null;
  }
</script>

<svelte:head>
  <title>Church Setup — Theobase</title>
</svelte:head>

<div class="pt-8">
  <Card class="mx-auto max-w-2xl">
    <CardHeader class="text-center">
      <CardTitle class="text-xl">Church Setup</CardTitle>
      <CardDescription>Let's get your congregation set up in a few steps.</CardDescription>
      <div class="pt-4">
        <StepIndicator steps={STEPS} current={currentStep} completed={completed} />
      </div>
    </CardHeader>

    <CardContent>
      {#if currentStep === 0}
        <p class="text-sm text-muted-foreground mb-4">Enter your church's basic information.</p>
        <div class="space-y-4">
          <FormField
            label="Church Name"
            value={churchName}
            required
            error={stepError}
            placeholder="e.g. Nairobi Central SDA Church"
            oninput={(e) => churchName = (e.target as HTMLInputElement).value}
          />
          <FormField
            label="Address"
            value={address}
            placeholder="e.g. 123 Main Street"
            oninput={(e) => address = (e.target as HTMLInputElement).value}
          />
          <div class="grid grid-cols-2 gap-4">
            <FormField
              label="Conference/Union"
              value={conference}
              placeholder="e.g. Nairobi Conference"
              oninput={(e) => conference = (e.target as HTMLInputElement).value}
            />
            <FormField
              label="Time Zone"
              value={timezone}
              placeholder="e.g. Africa/Nairobi"
              oninput={(e) => timezone = (e.target as HTMLInputElement).value}
            />
          </div>
        </div>

      {:else if currentStep === 1}
        <p class="text-sm text-muted-foreground mb-4">
          Paste your member CSV below. Format: firstName,lastName,email,phone,isMember (one row per line).
        </p>
        <FormField
          label="Member CSV"
          type="textarea"
          value={csvContent}
          placeholder="John,Doe,john@example.com,+254700000000,true&#10;Jane,Smith,jane@example.com,+254711111111,true"
          class="min-h-[160px]"
          oninput={(e) => csvContent = (e.target as HTMLTextAreaElement).value}
        />
        <button
          class="mt-3 text-sm text-muted-foreground underline hover:text-foreground transition-colors"
          onclick={skipStep}
        >
          Skip for now
        </button>

      {:else if currentStep === 2}
        <p class="text-sm text-muted-foreground mb-4">Select which departments your church runs.</p>
        <div class="space-y-3">
          {#each DEPARTMENT_OPTIONS as dept}
            <label class="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                class="size-4 rounded border-input accent-brand-600"
                checked={selectedDepartments.includes(dept)}
                onchange={() => toggleDepartment(dept)}
              />
              <span class="text-sm font-medium">{dept}</span>
            </label>
          {/each}
        </div>

      {:else if currentStep === 3}
        <p class="text-sm text-muted-foreground mb-4">Configure your church's bank account for receipt verification.</p>
        <div class="space-y-4">
          <FormField
            label="Bank Name"
            value={bankName}
            placeholder="e.g. Kenya Commercial Bank"
            oninput={(e) => bankName = (e.target as HTMLInputElement).value}
          />
          <FormField
            label="Account Name"
            value={accountName}
            placeholder="e.g. Nairobi Central SDA Church"
            oninput={(e) => accountName = (e.target as HTMLInputElement).value}
          />
          <FormField
            label="Account Number"
            value={accountNumber}
            placeholder="e.g. 1234567890"
            oninput={(e) => accountNumber = (e.target as HTMLInputElement).value}
          />
        </div>
        <button
          class="mt-3 text-sm text-muted-foreground underline hover:text-foreground transition-colors"
          onclick={skipStep}
        >
          Skip for now
        </button>

      {:else if currentStep === 4}
        <p class="text-sm text-muted-foreground mb-4">Send secure email invitations to your church officers.</p>
        <div class="flex items-end gap-3 mb-4">
          <div class="flex-1">
            <FormField
              label="Officer Email"
              type="email"
              value={officerEmail}
              placeholder="officer@example.com"
              oninput={(e) => officerEmail = (e.target as HTMLInputElement).value}
            />
          </div>
          <div class="w-44">
            <Label for="officer-role" class="mb-2 block">Role</Label>
            <Select bind:value={officerRole}>
              <SelectTrigger id="officer-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Clerk">Clerk</SelectItem>
                <SelectItem value="Treasurer">Treasurer</SelectItem>
                <SelectItem value="Elder">Elder</SelectItem>
                <SelectItem value="Department Head">Department Head</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onclick={addInvite} size="default">
            <Plus class="size-4" />
            Add
          </Button>
        </div>

        {#if pendingInvites.length > 0}
          <div class="space-y-2">
            {#each pendingInvites as invite, i}
              <div class="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="truncate">{invite.email}</span>
                  <Badge variant="secondary" class="shrink-0">{invite.role}</Badge>
                </div>
                <Button variant="ghost" size="icon-xs" onclick={() => removeInvite(i)} aria-label="Remove invite">
                  <X class="size-3" />
                </Button>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-muted-foreground">No officers added yet.</p>
        {/if}

        <p class="mt-4 text-xs text-muted-foreground">
          You can always invite more officers later from the Congregation page.
        </p>
      {/if}
    </CardContent>

    <CardFooter>
      <div class="flex items-center justify-between w-full">
        <Button variant="outline" onclick={back} disabled={currentStep === 0}>
          <ArrowLeft class="size-4" />
          Back
        </Button>
        <Button onclick={next}>
          {#if isLastStep}
            <Check class="size-4" />
            Complete Setup
          {:else}
            Next
            <ArrowRight class="size-4" />
          {/if}
        </Button>
      </div>
    </CardFooter>
  </Card>
</div>

<Celebration trigger={showCelebration} message="Setup complete! Welcome to Theobase." />

<ConfirmDialog
  open={removeInviteTarget !== null}
  onOpenChange={(o) => { if (!o) removeInviteTarget = null; }}
  title="Remove Invite"
  description="This action cannot be undone."
  confirmLabel="Remove"
  variant="destructive"
  onconfirm={confirmRemoveInvite}
/>
