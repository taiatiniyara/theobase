<script lang="ts">
  import { goto } from "$app/navigation";
  import { createCongregation, importMembers, inviteOfficer, api, getOrganizations, createOrganization, getDistricts, createDistrict, linkCongregationToDistrict } from "$lib/api";
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
  let submitting = $state(false);
  let submitError = $state("");

  let churchName = $state("");
  let churchType = $state("church");
  let address = $state("");
  let timezone = $state("");

  let conferences = $state<{ id: string; name: string }[]>([]);
  let conferenceId = $state("");
  let conferenceName = $state("");
  let showNewConference = $state(false);
  let newConferenceName = $state("");

  let unions = $state<{ id: string; name: string }[]>([]);
  let unionId = $state("");
  let unionName = $state("");
  let showNewUnion = $state(false);
  let newUnionName = $state("");

  let divisions = $state<{ id: string; name: string }[]>([]);
  let divisionId = $state("");
  let divisionName = $state("");
  let showNewDivision = $state(false);
  let newDivisionName = $state("");

  let districts = $state<{ id: string; name: string; organizationId: string | null }[]>([]);
  let districtId = $state("");
  let districtName = $state("");
  let showNewDistrict = $state(false);
  let newDistrictName = $state("");

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

  $effect(() => {
    getOrganizations("conference").then((data: any) => {
      conferences = Array.isArray(data) ? data : [];
    }).catch(() => {});
    getOrganizations("union").then((data: any) => {
      unions = Array.isArray(data) ? data : [];
    }).catch(() => {});
    getOrganizations("division").then((data: any) => {
      divisions = Array.isArray(data) ? data : [];
    }).catch(() => {});
  });

  $effect(() => {
    if (conferenceId) {
      getDistricts(conferenceId).then((data: any) => {
        districts = Array.isArray(data) ? data : [];
      }).catch(() => {});
    } else {
      districts = [];
    }
  });

  $effect(() => {
    if (conferenceId === "__new__") {
      showNewConference = true;
      conferenceId = "";
    }
    if (conferenceId && conferenceId !== "__new__") {
      conferenceName = "";
      unionName = "";
      unionId = "";
      divisionName = "";
      divisionId = "";
    }
  });

  $effect(() => {
    if (unionId === "__new__") {
      showNewUnion = true;
      unionId = "";
    }
    if (unionId && unionId !== "__new__") {
      unionName = "";
    }
  });

  $effect(() => {
    if (divisionId === "__new__") {
      showNewDivision = true;
      divisionId = "";
    }
    if (divisionId && divisionId !== "__new__") {
      divisionName = "";
    }
  });

  $effect(() => {
    if (districtId === "__new__") {
      showNewDistrict = true;
      districtId = "";
    }
    if (districtId && districtId !== "__new__") {
      districtName = "";
    }
  });

  function confirmNewConference() {
    if (!newConferenceName.trim()) return;
    conferenceName = newConferenceName.trim();
    conferenceId = "";
    showNewConference = false;
    newConferenceName = "";
    districtId = "";
    districtName = "";
    unionId = "";
    unionName = "";
    divisionId = "";
    divisionName = "";
  }

  function clearNewConference() {
    conferenceName = "";
    conferenceId = "";
    unionId = "";
    unionName = "";
    divisionId = "";
    divisionName = "";
    districtId = "";
    districtName = "";
  }

  function confirmNewUnion() {
    if (!newUnionName.trim()) return;
    unionName = newUnionName.trim();
    unionId = "";
    showNewUnion = false;
    newUnionName = "";
    divisionId = "";
    divisionName = "";
  }

  function clearNewUnion() {
    unionName = "";
    unionId = "";
    divisionId = "";
    divisionName = "";
  }

  function confirmNewDivision() {
    if (!newDivisionName.trim()) return;
    divisionName = newDivisionName.trim();
    divisionId = "";
    showNewDivision = false;
    newDivisionName = "";
  }

  function clearNewDivision() {
    divisionName = "";
    divisionId = "";
  }

  function confirmNewDistrict() {
    if (!newDistrictName.trim()) return;
    districtName = newDistrictName.trim();
    districtId = "";
    showNewDistrict = false;
    newDistrictName = "";
  }

  function clearNewDistrict() {
    districtName = "";
    districtId = "";
  }

  function validateStep(): boolean {
    stepError = "";
    if (currentStep === 0 && !churchName.trim()) {
      stepError = "Church Name is required.";
      return false;
    }
    if (currentStep === 0 && showNewConference && !newConferenceName.trim()) {
      stepError = "Please enter or select a conference.";
      return false;
    }
    return true;
  }

  async function submitSetup() {
    submitting = true;
    submitError = "";
    try {
      let orgId: string | undefined;

      if (conferenceId) {
        orgId = conferenceId;
      } else if (conferenceName) {
        let parentId: string | undefined;

        if (unionId) {
          parentId = unionId;
        } else if (unionName) {
          let divisionParentId: string | undefined;
          if (divisionId) {
            divisionParentId = divisionId;
          } else if (divisionName) {
            const div: any = await createOrganization({
              name: divisionName,
              type: "division",
            });
            if (div.error) {
              submitError = `Could not create division: ${div.error}`;
              submitting = false;
              return;
            }
            divisionParentId = div.id;
          }

          const union: any = await createOrganization({
            name: unionName,
            type: "union",
            parentId: divisionParentId,
          });
          if (union.error) {
            submitError = `Could not create union: ${union.error}`;
            submitting = false;
            return;
          }
          parentId = union.id;
        }

        const created: any = await createOrganization({
          name: conferenceName,
          type: "conference",
          parentId,
        });
        if (created.error) {
          submitError = created.error;
          submitting = false;
          return;
        }
        orgId = created.id;
      }

      const result = await createCongregation({
        name: churchName.trim(),
        type: churchType,
        timezone: timezone || undefined,
        organizationId: orgId,
      });

      if (result.error) {
        submitError = result.error;
        submitting = false;
        return;
      }

      const congregationId = result.id;

      let distId: string | undefined;
      if (districtId) {
        distId = districtId;
      } else if (districtName) {
        const created: any = await createDistrict({
          name: districtName,
          organizationId: orgId,
        });
        if (created.error) {
          submitError = created.error;
          submitting = false;
          return;
        }
        distId = created.id;
      }

      if (distId) {
        await linkCongregationToDistrict(distId, congregationId);
      }

      if (csvContent.trim()) {
        try {
          await importMembers(congregationId, csvContent.trim());
        } catch { /* non-fatal */ }
      }

      for (const invite of pendingInvites) {
        await inviteOfficer(congregationId, {
          email: invite.email,
          role: invite.role,
        });
      }

      const deptMap: Record<string, string> = {
        "Pathfinders": "pathfinders",
        "Sabbath School": "sabbath_school",
        "Dorcas/Welfare": "dorcas",
        "Health Ministry": "health",
        "AV Team": "av",
        "Facilities": "other",
      };
      for (const deptName of selectedDepartments) {
        await api('/departments', { method: 'POST', body: JSON.stringify({ name: deptName, type: deptMap[deptName] || "other" }) });
      }

      if (bankName && accountName && accountNumber) {
        await api(`/congregations/${congregationId}/bank-account`, {
          method: 'POST', body: JSON.stringify({ bankName, accountName, accountNumber }),
        });
      }

      showCelebration = true;
      setTimeout(() => goto("/dashboard"), 3000);
    } catch (err: any) {
      submitError = err?.message || "Setup failed. Please try again.";
    }
    submitting = false;
  }

  function next() {
    if (!validateStep()) return;
    if (isLastStep) {
      submitSetup();
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
          <div>
            <Label for="church-type" class="mb-2 block">Church Type</Label>
            <Select bind:value={churchType}>
              <SelectTrigger id="church-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="church">Local Church</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="branch">Branch Sabbath School</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormField
            label="Address"
            value={address}
            placeholder="e.g. 123 Main Street"
            oninput={(e) => address = (e.target as HTMLInputElement).value}
          />

          <div>
            <Label for="conference" class="mb-2 block">Conference / Mission</Label>
            {#if showNewConference}
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Enter conference name"
                  value={newConferenceName}
                  oninput={(e) => newConferenceName = (e.target as HTMLInputElement).value}
                  onkeydown={(e) => { if (e.key === 'Enter') confirmNewConference(); }}
                />
                <Button variant="outline" size="sm" onclick={confirmNewConference}>Add</Button>
                <Button variant="ghost" size="icon-sm" onclick={() => { showNewConference = false; newConferenceName = ''; }} aria-label="Cancel">
                  <X class="size-4" />
                </Button>
              </div>
            {:else if conferenceName && !conferenceId}
              <div class="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                <span class="text-muted-foreground">
                  <Badge variant="secondary" class="mr-2">New</Badge>
                  {conferenceName}
                </span>
                <Button variant="ghost" size="icon-xs" onclick={clearNewConference} aria-label="Remove">
                  <X class="size-3" />
                </Button>
              </div>
            {:else}
              <Select bind:value={conferenceId}>
                <SelectTrigger id="conference">
                  <SelectValue placeholder="Select a conference" />
                </SelectTrigger>
                <SelectContent>
                  {#each conferences as conf}
                    <SelectItem value={conf.id}>{conf.name}</SelectItem>
                  {/each}
                  <SelectItem value="__new__">+ Create new conference...</SelectItem>
                </SelectContent>
              </Select>
            {/if}
          </div>

          {#if conferenceName && !conferenceId}
            <div>
              <Label for="union" class="mb-2 block">Parent Union</Label>
              {#if showNewUnion}
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Enter union name"
                    value={newUnionName}
                    oninput={(e) => newUnionName = (e.target as HTMLInputElement).value}
                    onkeydown={(e) => { if (e.key === 'Enter') confirmNewUnion(); }}
                  />
                  <Button variant="outline" size="sm" onclick={confirmNewUnion}>Add</Button>
                  <Button variant="ghost" size="icon-sm" onclick={() => { showNewUnion = false; newUnionName = ''; }} aria-label="Cancel">
                    <X class="size-4" />
                  </Button>
                </div>
              {:else if unionName && !unionId}
                <div class="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <span class="text-muted-foreground">
                    <Badge variant="secondary" class="mr-2">New</Badge>
                    {unionName}
                  </span>
                  <Button variant="ghost" size="icon-xs" onclick={clearNewUnion} aria-label="Remove">
                    <X class="size-3" />
                  </Button>
                </div>
              {:else}
                <Select bind:value={unionId}>
                  <SelectTrigger id="union">
                    <SelectValue placeholder="Select a union (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {#each unions as u}
                      <SelectItem value={u.id}>{u.name}</SelectItem>
                    {/each}
                    <SelectItem value="__new__">+ Create new union...</SelectItem>
                  </SelectContent>
                </Select>
              {/if}
              <p class="mt-1 text-xs text-muted-foreground">Optional — the union your new conference belongs to.</p>
            </div>

            {#if unionName && !unionId}
              <div>
                <Label for="division" class="mb-2 block">Parent Division</Label>
                {#if showNewDivision}
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Enter division name"
                      value={newDivisionName}
                      oninput={(e) => newDivisionName = (e.target as HTMLInputElement).value}
                      onkeydown={(e) => { if (e.key === 'Enter') confirmNewDivision(); }}
                    />
                    <Button variant="outline" size="sm" onclick={confirmNewDivision}>Add</Button>
                    <Button variant="ghost" size="icon-sm" onclick={() => { showNewDivision = false; newDivisionName = ''; }} aria-label="Cancel">
                      <X class="size-4" />
                    </Button>
                  </div>
                {:else if divisionName && !divisionId}
                  <div class="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <span class="text-muted-foreground">
                      <Badge variant="secondary" class="mr-2">New</Badge>
                      {divisionName}
                    </span>
                    <Button variant="ghost" size="icon-xs" onclick={clearNewDivision} aria-label="Remove">
                      <X class="size-3" />
                    </Button>
                  </div>
                {:else}
                  <Select bind:value={divisionId}>
                    <SelectTrigger id="division">
                      <SelectValue placeholder="Select a division (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {#each divisions as div}
                        <SelectItem value={div.id}>{div.name}</SelectItem>
                      {/each}
                      <SelectItem value="__new__">+ Create new division...</SelectItem>
                    </SelectContent>
                  </Select>
                {/if}
                <p class="mt-1 text-xs text-muted-foreground">Optional — the division your new union belongs to.</p>
              </div>
            {/if}
          {/if}

          {#if conferenceId || conferenceName}
            <div>
              <Label for="district" class="mb-2 block">District</Label>
              {#if showNewDistrict}
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Enter district name"
                    value={newDistrictName}
                    oninput={(e) => newDistrictName = (e.target as HTMLInputElement).value}
                    onkeydown={(e) => { if (e.key === 'Enter') confirmNewDistrict(); }}
                  />
                  <Button variant="outline" size="sm" onclick={confirmNewDistrict}>Add</Button>
                  <Button variant="ghost" size="icon-sm" onclick={() => { showNewDistrict = false; newDistrictName = ''; }} aria-label="Cancel">
                    <X class="size-4" />
                  </Button>
                </div>
              {:else if districtName && !districtId}
                <div class="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <span class="text-muted-foreground">
                    <Badge variant="secondary" class="mr-2">New</Badge>
                    {districtName}
                  </span>
                  <Button variant="ghost" size="icon-xs" onclick={clearNewDistrict} aria-label="Remove">
                    <X class="size-3" />
                  </Button>
                </div>
              {:else}
                <Select bind:value={districtId}>
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Select a district (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {#each districts as dist}
                      <SelectItem value={dist.id}>{dist.name}</SelectItem>
                    {/each}
                    <SelectItem value="__new__">+ Create new district...</SelectItem>
                  </SelectContent>
                </Select>
              {/if}
              <p class="mt-1 text-xs text-muted-foreground">Optional — churches sharing a pastor usually belong to the same district.</p>
            </div>
          {/if}

          <FormField
            label="Time Zone"
            value={timezone}
            placeholder="e.g. Africa/Nairobi"
            oninput={(e) => timezone = (e.target as HTMLInputElement).value}
          />
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

    {#if submitError}
      <div class="px-6 pb-2">
        <p class="text-sm text-red-600">{submitError}</p>
      </div>
    {/if}

    <CardFooter>
      <div class="flex items-center justify-between w-full">
        <Button variant="outline" onclick={back} disabled={currentStep === 0}>
          <ArrowLeft class="size-4" />
          Back
        </Button>
        <Button onclick={next} disabled={submitting}>
          {#if submitting}
            Setting up...
          {:else if isLastStep}
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
