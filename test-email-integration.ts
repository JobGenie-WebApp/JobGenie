// Test JobGenie email integration
import { sendVerificationEmail } from './src/lib/email';

async function testEmailIntegration() {
    console.log('🧪 Testing JobGenie Email Integration');
    console.log('====================================\n');

    try {
        console.log('📧 Testing verification email function...');
        const result = await sendVerificationEmail('pathumlk.diz@gmail.com', '123456', 'Integration Test');
        
        if (result.success) {
            console.log('✅ Verification email sent successfully');
        } else {
            console.log('❌ Verification email failed:', result.error);
        }

        console.log('\n🎉 Integration test completed!');
    } catch (error) {
        console.error('❌ Integration test failed:', error);
    }
}

testEmailIntegration();