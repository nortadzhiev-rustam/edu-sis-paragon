/**
 * Guardian Lifecycle Management Demo
 * Demonstrates the soft-delete vs hard-delete system functionality
 */

import guardianService from '../services/guardianService';

/**
 * Demo script to test guardian lifecycle management
 * This script demonstrates the three operations:
 * 1. 🟡 Soft Delete (Deactivate) - Reversible
 * 2. 🔴 Hard Delete - Permanent removal
 * 3. 🟢 Reactivate - Restore deactivated guardians
 */
export const runGuardianLifecycleDemo = async (authCode, pickupCardId) => {
  console.log('🚀 GUARDIAN LIFECYCLE DEMO: Starting demonstration...');
  console.log('📋 GUARDIAN LIFECYCLE DEMO: Auth Code:', authCode);
  console.log('🆔 GUARDIAN LIFECYCLE DEMO: Pickup Card ID:', pickupCardId);

  try {
    // Step 1: List current guardians
    console.log('\n📋 Step 1: Listing current guardians...');
    const initialList = await guardianService.listGuardians(authCode);
    console.log('📋 Current guardians:', initialList.guardians?.length || 0);

    // Find the target guardian
    const targetGuardian = initialList.guardians?.find(
      (g) => g.pickup_card_id === pickupCardId
    );

    if (!targetGuardian) {
      console.log('❌ DEMO ERROR: Guardian not found with ID:', pickupCardId);
      return;
    }

    console.log('🎯 Target guardian found:', {
      name: targetGuardian.name,
      status: targetGuardian.status,
      relation: targetGuardian.relation,
    });

    // Step 2: Demonstrate based on current status
    if (targetGuardian.status === 1) {
      // Guardian is active - demonstrate deactivation
      console.log('\n🟡 Step 2: Demonstrating SOFT DELETE (Deactivate)...');
      console.log('🟡 This will:');
      console.log('  • Set status = 0');
      console.log('  • Keep all data intact');
      console.log('  • Remove mobile device access');
      console.log('  • Allow reactivation later');

      const deactivateResult = await guardianService.deactivateGuardian(
        authCode,
        pickupCardId
      );

      console.log('🟡 Deactivation result:', deactivateResult);

      if (deactivateResult.success) {
        console.log('✅ SOFT DELETE successful!');
        console.log('📝 Message:', deactivateResult.message);
        console.log('🔄 Reversible:', deactivateResult.reversible);

        // Step 3: Demonstrate reactivation
        console.log('\n🟢 Step 3: Demonstrating REACTIVATION...');
        console.log('🟢 This will:');
        console.log('  • Restore status = 1');
        console.log('  • Check 5-guardian limit');
        console.log('  • Restore mobile access');
        console.log('  • Preserve all original data');

        // Wait a moment to simulate real-world usage
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const reactivateResult = await guardianService.reactivateGuardian(
          authCode,
          pickupCardId
        );

        console.log('🟢 Reactivation result:', reactivateResult);

        if (reactivateResult.success) {
          console.log('✅ REACTIVATION successful!');
          console.log('📝 Message:', reactivateResult.message);
          if (reactivateResult.guardian_limit_check) {
            const { current_active, limit, remaining } =
              reactivateResult.guardian_limit_check;
            console.log(
              `📊 Guardian Limit: ${current_active}/${limit} (${remaining} remaining)`
            );
          }
        } else {
          console.log('❌ REACTIVATION failed:', reactivateResult.message);
        }
      } else {
        console.log('❌ SOFT DELETE failed:', deactivateResult.message);
      }
    } else {
      // Guardian is inactive - demonstrate reactivation
      console.log('\n🟢 Step 2: Guardian is inactive - demonstrating REACTIVATION...');

      const reactivateResult = await guardianService.reactivateGuardian(
        authCode,
        pickupCardId
      );

      console.log('🟢 Reactivation result:', reactivateResult);

      if (reactivateResult.success) {
        console.log('✅ REACTIVATION successful!');
        console.log('📝 Message:', reactivateResult.message);
      } else {
        console.log('❌ REACTIVATION failed:', reactivateResult.message);
      }
    }

    // Step 4: Final guardian list
    console.log('\n📋 Step 4: Final guardian status...');
    const finalList = await guardianService.listGuardians(authCode);
    const finalGuardian = finalList.guardians?.find(
      (g) => g.pickup_card_id === pickupCardId
    );

    if (finalGuardian) {
      console.log('🎯 Final guardian status:', {
        name: finalGuardian.name,
        status: finalGuardian.status,
        status_text: finalGuardian.status === 1 ? 'Active' : 'Inactive',
      });
    } else {
      console.log('❌ Guardian not found in final list (may have been hard deleted)');
    }

    console.log('\n✅ GUARDIAN LIFECYCLE DEMO: Completed successfully!');
  } catch (error) {
    console.error('❌ GUARDIAN LIFECYCLE DEMO: Error occurred:', error);
    throw error;
  }
};

/**
 * Demo for hard delete (use with extreme caution)
 * This is a separate function because hard delete is irreversible
 */
export const runHardDeleteDemo = async (authCode, pickupCardId) => {
  console.log('🔴 HARD DELETE DEMO: Starting DANGEROUS operation...');
  console.log('⚠️  WARNING: This will PERMANENTLY delete the guardian!');
  console.log('⚠️  WARNING: This action CANNOT be undone!');

  try {
    // Get guardian info before deletion
    const guardianList = await guardianService.listGuardians(authCode);
    const targetGuardian = guardianList.guardians?.find(
      (g) => g.pickup_card_id === pickupCardId
    );

    if (!targetGuardian) {
      console.log('❌ DEMO ERROR: Guardian not found with ID:', pickupCardId);
      return;
    }

    console.log('🎯 Target guardian for PERMANENT deletion:', {
      name: targetGuardian.name,
      relation: targetGuardian.relation,
      status: targetGuardian.status,
    });

    console.log('\n🔴 Executing HARD DELETE...');
    console.log('🔴 This will:');
    console.log('  • DELETE record from database');
    console.log('  • Remove mobile device access');
    console.log('  • LOSE all data permanently');
    console.log('  • CANNOT be undone');

    const deleteResult = await guardianService.deleteGuardian(authCode, pickupCardId);

    console.log('🔴 Hard delete result:', deleteResult);

    if (deleteResult.success) {
      console.log('💀 HARD DELETE completed!');
      console.log('📝 Message:', deleteResult.message);
      console.log('🔄 Reversible:', deleteResult.reversible);

      // Verify deletion
      const verifyList = await guardianService.listGuardians(authCode);
      const deletedGuardian = verifyList.guardians?.find(
        (g) => g.pickup_card_id === pickupCardId
      );

      if (!deletedGuardian) {
        console.log('✅ VERIFICATION: Guardian successfully removed from database');
      } else {
        console.log('❌ VERIFICATION: Guardian still exists (deletion may have failed)');
      }
    } else {
      console.log('❌ HARD DELETE failed:', deleteResult.message);
    }

    console.log('\n💀 HARD DELETE DEMO: Completed!');
  } catch (error) {
    console.error('❌ HARD DELETE DEMO: Error occurred:', error);
    throw error;
  }
};

/**
 * Utility function to display guardian lifecycle options
 */
export const displayLifecycleOptions = (guardian) => {
  console.log('\n🔧 GUARDIAN LIFECYCLE OPTIONS:');
  console.log('Guardian:', guardian.name, `(Status: ${guardian.status})`);

  if (guardian.status === 1) {
    console.log('🟡 Available: SOFT DELETE (Deactivate)');
    console.log('  • Reversible action');
    console.log('  • Preserves all data');
    console.log('  • Removes mobile access');
    console.log('  • Can be reactivated later');

    console.log('🔴 Available: HARD DELETE (Permanent)');
    console.log('  • ⚠️  IRREVERSIBLE action');
    console.log('  • ⚠️  Deletes all data');
    console.log('  • ⚠️  Cannot be undone');
  } else {
    console.log('🟢 Available: REACTIVATE');
    console.log('  • Restores guardian access');
    console.log('  • Checks 5-guardian limit');
    console.log('  • Preserves all data');

    console.log('🔴 Available: HARD DELETE (Permanent)');
    console.log('  • ⚠️  IRREVERSIBLE action');
    console.log('  • ⚠️  Deletes all data');
    console.log('  • ⚠️  Cannot be undone');
  }
};

export default {
  runGuardianLifecycleDemo,
  runHardDeleteDemo,
  displayLifecycleOptions,
};
