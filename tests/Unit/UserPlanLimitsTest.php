<?php

use App\Enums\UserPlan;

// === UserPlan Enum Tests ===

describe('UserPlan::maxProjects()', function () {
    it('returns 3 for Free plan', function () {
        expect(UserPlan::Free->maxProjects())->toBe(3);
    });

    it('returns null (unlimited) for Pro plan', function () {
        expect(UserPlan::Pro->maxProjects())->toBeNull();
    });
});

describe('UserPlan::maxListsPerProject()', function () {
    it('returns 5 for Free plan', function () {
        expect(UserPlan::Free->maxListsPerProject())->toBe(5);
    });

    it('returns null (unlimited) for Pro plan', function () {
        expect(UserPlan::Pro->maxListsPerProject())->toBeNull();
    });
});

describe('UserPlan::activityRetentionDays()', function () {
    it('returns 7 days for Free plan', function () {
        expect(UserPlan::Free->activityRetentionDays())->toBe(7);
    });

    it('returns 30 days for Pro plan', function () {
        expect(UserPlan::Pro->activityRetentionDays())->toBe(30);
    });
});

describe('UserPlan::canUseChat()', function () {
    it('returns true for Free plan', function () {
        expect(UserPlan::Free->canUseChat())->toBeTrue();
    });

    it('returns true for Pro plan', function () {
        expect(UserPlan::Pro->canUseChat())->toBeTrue();
    });
});

describe('UserPlan::canUseDueDateReminders()', function () {
    it('returns false for Free plan', function () {
        expect(UserPlan::Free->canUseDueDateReminders())->toBeFalse();
    });

    it('returns true for Pro plan', function () {
        expect(UserPlan::Pro->canUseDueDateReminders())->toBeTrue();
    });
});

describe('UserPlan::hasFullPalette()', function () {
    it('returns false for Free plan', function () {
        expect(UserPlan::Free->hasFullPalette())->toBeFalse();
    });

    it('returns true for Pro plan', function () {
        expect(UserPlan::Pro->hasFullPalette())->toBeTrue();
    });
});

describe('UserPlan::getLimits()', function () {
    it('returns correct limits for Free plan', function () {
        $limits = UserPlan::Free->getLimits();

        expect($limits)->toMatchArray([
            'max_projects' => 3,
            'max_lists_per_project' => 5,
            'activity_retention_days' => 7,
            'can_invite_members' => false,
            'can_use_chat' => true,
            'can_use_due_date_reminders' => false,
            'has_full_palette' => false,
        ]);
    });

    it('returns correct limits for Pro plan', function () {
        $limits = UserPlan::Pro->getLimits();

        expect($limits)->toMatchArray([
            'max_projects' => null,
            'max_lists_per_project' => null,
            'activity_retention_days' => 30,
            'can_invite_members' => true,
            'can_use_chat' => true,
            'can_use_due_date_reminders' => true,
            'has_full_palette' => true,
        ]);
    });
});
