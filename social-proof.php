<?php
/**
 * Plugin Name: Social Proof
 * Description: בלוק Social Proof שמציג את שלוש החתימות האחרונות על עצומה (Gravity Forms) בסבב מתחלף, לבניית אמון חברתי בעמוד.
 * Version: 1.1.2
 * Requires at least: 6.3
 * Requires PHP: 8.0
 * Text Domain: social-proof
 */

defined( 'ABSPATH' ) || exit;

define( 'SOCIAL_PROOF_DIR', plugin_dir_path( __FILE__ ) );
define( 'SOCIAL_PROOF_URL', plugin_dir_url( __FILE__ ) );
define( 'SOCIAL_PROOF_VERSION', '1.1.2' );

require_once SOCIAL_PROOF_DIR . 'includes/class-social-proof-gravity-forms.php';
require_once SOCIAL_PROOF_DIR . 'includes/class-social-proof-rest.php';

add_action(
	'init',
	function () {
		register_block_type( SOCIAL_PROOF_DIR . 'build' );
	}
);

// Run after the Planet4 theme's allowed_block_types_all filter (priority 10) so we can append our block.
add_filter( 'allowed_block_types_all', 'social_proof_allow_block', 20 );
function social_proof_allow_block( $allowed ) {
	if ( ! is_array( $allowed ) ) {
		return $allowed; // true = all blocks already allowed
	}
	return array_merge( $allowed, [ 'social-proof/signature' ] );
}

Social_Proof_Gravity_Forms::init();
Social_Proof_REST::init();
