<?php
/**
 * Server-side render for social-proof/signature.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block default content (unused, dynamic block).
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$form_id          = isset( $attributes['formId'] ) ? (int) $attributes['formId'] : 0;
$language         = isset( $attributes['language'] ) && 'en' === $attributes['language'] ? 'en' : 'he';
$align            = isset( $attributes['align'] ) ? $attributes['align'] : 'right';
$text_color       = isset( $attributes['textColor'] ) ? $attributes['textColor'] : '';
$background_type  = isset( $attributes['backgroundType'] ) && 'gradient' === $attributes['backgroundType'] ? 'gradient' : 'solid';
$background_color = isset( $attributes['backgroundColor'] ) ? $attributes['backgroundColor'] : '';
$gradient_color_1 = isset( $attributes['gradientColor1'] ) ? $attributes['gradientColor1'] : '#1d9e75';
$gradient_color_2 = isset( $attributes['gradientColor2'] ) ? $attributes['gradientColor2'] : '#0693e3';
$gradient_angle   = isset( $attributes['gradientAngle'] ) ? (int) $attributes['gradientAngle'] : 135;
$animation_style  = isset( $attributes['animationStyle'] ) ? $attributes['animationStyle'] : 'fade';
$fixed_timestamps = ! empty( $attributes['fixedTimestamps'] );
$template         = ! empty( $attributes['template'] )
	? $attributes['template']
	: Social_Proof_Gravity_Forms::default_template( $language );

if ( ! $form_id || ! Social_Proof_Gravity_Forms::is_active() ) {
	return;
}

$signatures = Social_Proof_Gravity_Forms::get_recent_signatures( $form_id, 3, $language, $fixed_timestamps );

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

$background = 'gradient' === $background_type
	? sprintf( 'linear-gradient(%ddeg, %s 0%%, %s 100%%)', $gradient_angle, $gradient_color_1, $gradient_color_2 )
	: $background_color;

$pill_style = array();
if ( $text_color ) {
	$pill_style[] = 'color:' . $text_color;
}
if ( $background ) {
	$pill_style[] = 'background:' . $background;
}
$pill_style_attr = safecss_filter_attr( implode( ';', $pill_style ) );
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput ?> data-rotate-interval="1500">
	<div class="social-proof__viewport" data-animation="<?php echo esc_attr( $animation_style ); ?>" <?php echo $pill_style_attr ? 'style="' . esc_attr( $pill_style_attr ) . '"' : ''; ?>>
		<?php foreach ( $signatures as $index => $signature ) : ?>
			<span class="social-proof__item<?php echo 0 === $index ? ' is-active' : ''; ?>">
				<?php echo esc_html( Social_Proof_Gravity_Forms::render_template( $template, $signature['name'], $signature['time_ago'] ) ); ?>
			</span>
		<?php endforeach; ?>
	</div>
</div>
