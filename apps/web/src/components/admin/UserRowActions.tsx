'use client';

import { useState } from 'react';
import { ShieldCheck, UserX, UserCheck } from 'lucide-react';
import type { AdminUserListItem } from '@stackdify/shared-types';
import { Role } from '@stackdify/shared-types';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useUpdateUserRole, useDeactivateUser, useActivateUser } from '@/lib/api';

const ROLE_OPTIONS = [
  { value: Role.USER, label: 'User' },
  { value: Role.CONTENT_EDITOR, label: 'Content Editor' },
  { value: Role.ADMIN, label: 'Admin' },
];

interface UserRowActionsProps {
  user: AdminUserListItem;
  token: string;
  currentUserId: string;
}

export function UserRowActions({ user, token, currentUserId }: UserRowActionsProps) {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);

  const updateRole = useUpdateUserRole(token);
  const deactivate = useDeactivateUser(token);
  const activate = useActivateUser(token);

  const isSelf = user.id === currentUserId;
  const isDeactivated = !!user.deactivatedAt;
  const isPending = deactivate.isPending || activate.isPending;

  const handleOpenRole = () => {
    setSelectedRole(user.role);
    setShowRoleModal(true);
  };

  const handleSaveRole = () => {
    void updateRole.mutateAsync({ id: user.id, role: selectedRole }).then(() =>
      setShowRoleModal(false),
    );
  };

  const handleDeactivate = () => {
    void deactivate.mutateAsync(user.id).then(() => setShowDeactivateModal(false));
  };

  const handleActivate = () => {
    void activate.mutateAsync(user.id);
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {/* Change role */}
        <button
          type="button"
          title={isSelf ? 'Cannot change your own role' : 'Change role'}
          onClick={handleOpenRole}
          disabled={isSelf || isDeactivated}
          className="cursor-pointer rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/8 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        {/* Deactivate / Activate */}
        {isDeactivated ? (
          <button
            type="button"
            title="Activate user"
            onClick={handleActivate}
            disabled={isPending}
            className="cursor-pointer rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--slot-correct)]/10 hover:text-[var(--slot-correct)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            title={isSelf ? 'Cannot deactivate yourself' : 'Deactivate user'}
            onClick={() => setShowDeactivateModal(true)}
            disabled={isSelf || isPending}
            className="cursor-pointer rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--slot-incorrect)]/10 hover:text-[var(--slot-incorrect)] disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
          >
            <UserX className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Role modal */}
      <Modal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={`Change role for @${user.username}`}
      >
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Current role:{' '}
          <strong className="text-[var(--text-primary)]">{user.role}</strong>
        </p>
        <Select
          label="New role"
          options={ROLE_OPTIONS}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as Role)}
        />
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={updateRole.isPending || selectedRole === user.role}
            onClick={handleSaveRole}
          >
            {updateRole.isPending ? 'Saving…' : 'Save Role'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Deactivate confirmation modal */}
      <Modal
        open={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Deactivate user?"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">@{user.username}</strong> will lose
          access immediately. Their existing data is preserved and you can reactivate them at any
          time.
        </p>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setShowDeactivateModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={deactivate.isPending}
            onClick={handleDeactivate}
            className="bg-[var(--slot-incorrect)] hover:bg-[var(--slot-incorrect)]/90"
          >
            {deactivate.isPending ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
