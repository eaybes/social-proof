<?php
/**
 * REST routes used by the block editor: list of Gravity Forms and a live
 * preview of the rendered signature strings for the current form/template/language.
 */

defined( 'ABSPATH' ) || exit;

class Social_Proof_REST {

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes() {
		register_rest_route(
			'social-proof/v1',
			'/forms',
			array(
				'methods'             => 'GET',
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
				'callback'            => array( __CLASS__, 'get_forms' ),
			)
		);

		register_rest_route(
			'social-proof/v1',
			'/preview',
			array(
				'methods'             => 'GET',
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
				'args'                => array(
					'formId'   => array(
						'required' => true,
						'type'     => 'integer',
					),
					'language' => array(
						'type'    => 'string',
						'default' => 'he',
					),
					'template' => array(
						'type' => 'string',
					),
					'fixedTimestamps' => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
				'callback'            => array( __CLASS__, 'get_preview' ),
			)
		);
	}

	public static function get_forms() {
		if ( ! Social_Proof_Gravity_Forms::is_active() ) {
			return new WP_REST_Response(
				array(
					'active' => false,
					'forms'  => array(),
				),
				200
			);
		}

		$forms = array_map(
			function ( $form ) {
				return array(
					'id'    => (int) $form['id'],
					'title' => $form['title'],
				);
			},
			GFAPI::get_forms()
		);

		return new WP_REST_Response(
			array(
				'active' => true,
				'forms'  => $forms,
			),
			200
		);
	}

	public static function get_preview( WP_REST_Request $request ) {
		$form_id          = (int) $request->get_param( 'formId' );
		$language         = $request->get_param( 'language' );
		$template         = $request->get_param( 'template' );
		$fixed_timestamps = (bool) $request->get_param( 'fixedTimestamps' );

		if ( ! $template ) {
			$template = Social_Proof_Gravity_Forms::default_template( $language );
		}

		$signatures = Social_Proof_Gravity_Forms::get_recent_signatures( $form_id, 3, $language, $fixed_timestamps );

		$items = array_map(
			function ( $sig ) use ( $template ) {
				return Social_Proof_Gravity_Forms::render_template( $template, $sig['name'], $sig['time_ago'] );
			},
			$signatures
		);

		return new WP_REST_Response( array( 'items' => $items ), 200 );
	}
}
