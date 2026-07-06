<?php
/**
 * Server-side render for social-proof/signature.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block default content (unused, dynamic block).
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$form_id  = isset( $attributes['formId'] ) ? (int) $attributes['formId'] : 0;
$language = isset( $attributes['language'] ) && 'en' === $attributes['language'] ? 'en' : 'he';
$align    = isset( $attributes['align'] ) ? $attributes['align'] : 'right';
$template = ! empty( $attributes['template'] )
	? $attributes['template']
	: Social_Proof_Gravity_Forms::default_template( $language );

if ( ! $form_id || ! Social_Proof_Gravity_Forms::is_active() ) {
	return;
}

$signatures = Social_Proof_Gravity_Forms::get_recent_signatures( $form_id, 3, $language );

if ( empty( $signatures ) ) {
	return;
}

$dir = 'he' === $language ? 'rtl' : 'ltr';

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => 'social-proof-align-' . sanitize_html_class( $align ),
		'dir'   => $dir,
		'lang'  => $language,
	)
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput ?> data-rotate-interval="1500">
	<div class="social-proof__viewport">
		<?php foreach ( $signatures as $index => $signature ) : ?>
			<span class="social-proof__item<?php echo 0 === $index ? ' is-active' : ''; ?>">
				<?php echo esc_html( Social_Proof_Gravity_Forms::render_template( $template, $signature['name'], $signature['time_ago'] ) ); ?>
			</span>
		<?php endforeach; ?>
	</div>
</div>
