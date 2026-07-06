<?php
/**
 * Gravity Forms integration: fetches recent entries, extracts signer names,
 * and formats relative "time ago" strings independent of site locale.
 */

defined( 'ABSPATH' ) || exit;

class Social_Proof_Gravity_Forms {

	const CACHE_TTL = 60; // seconds

	public static function init() {
		add_action( 'gform_after_submission', array( __CLASS__, 'clear_cache_on_submission' ), 10, 2 );
	}

	public static function clear_cache_on_submission( $entry, $form ) {
		delete_transient( 'social_proof_entries_' . $form['id'] );
	}

	public static function is_active() {
		return class_exists( 'GFAPI' );
	}

	public static function default_template( $language ) {
		return 'en' === $language
			? '{name} signed the petition {time_ago}'
			: '{name} חתם/ה על העצומה {time_ago}';
	}

	public static function render_template( $template, $name, $time_ago ) {
		return strtr(
			$template,
			array(
				'{name}'     => $name,
				'{time_ago}' => $time_ago,
			)
		);
	}

	/**
	 * Returns up to $count most recent signatures as [ 'name' => ..., 'time_ago' => ... ].
	 */
	public static function get_recent_signatures( $form_id, $count = 3, $language = 'he' ) {
		if ( ! self::is_active() || ! $form_id ) {
			return array();
		}

		$entries = self::get_cached_entries( $form_id );

		$signatures = array();
		foreach ( array_slice( $entries, 0, $count ) as $entry ) {
			$signatures[] = array(
				'name'     => $entry['name'],
				'time_ago' => self::time_ago( $entry['timestamp'], $language ),
			);
		}

		return $signatures;
	}

	private static function get_cached_entries( $form_id ) {
		$cache_key = 'social_proof_entries_' . $form_id;
		$entries   = get_transient( $cache_key );

		if ( false !== $entries ) {
			return $entries;
		}

		$form          = GFAPI::get_form( $form_id );
		$name_field_id = $form ? self::find_name_field_id( $form ) : null;

		if ( ! $form || null === $name_field_id ) {
			set_transient( $cache_key, array(), self::CACHE_TTL );
			return array();
		}

		$raw_entries = GFAPI::get_entries(
			$form_id,
			array( 'status' => 'active' ),
			array(
				'key'       => 'date_created',
				'direction' => 'DESC',
			),
			array(
				'offset'    => 0,
				'page_size' => 10,
			)
		);

		$entries = array();
		foreach ( (array) $raw_entries as $entry ) {
			$entries[] = array(
				'name'      => self::format_name( $entry, $name_field_id ),
				'timestamp' => strtotime( $entry['date_created'] . ' UTC' ),
			);
		}

		set_transient( $cache_key, $entries, self::CACHE_TTL );

		return $entries;
	}

	private static function find_name_field_id( $form ) {
		if ( empty( $form['fields'] ) ) {
			return null;
		}

		foreach ( $form['fields'] as $field ) {
			$type = is_object( $field ) ? $field->type : $field['type'];
			if ( 'name' === $type ) {
				return is_object( $field ) ? $field->id : $field['id'];
			}
		}

		return null;
	}

	private static function format_name( $entry, $name_field_id ) {
		$first        = trim( rgar( $entry, $name_field_id . '.3' ) );
		$last         = trim( rgar( $entry, $name_field_id . '.6' ) );
		$last_initial = '' !== $last ? mb_substr( $last, 0, 1 ) . '.' : '';

		return trim( $first . ' ' . $last_initial );
	}

	public static function time_ago( $timestamp, $language = 'he' ) {
		$diff = max( 0, time() - (int) $timestamp );

		if ( 'en' === $language ) {
			return self::time_ago_en( $diff );
		}

		return self::time_ago_he( $diff );
	}

	private static function time_ago_en( $diff ) {
		if ( $diff < 30 ) {
			return 'just now';
		}
		if ( $diff < HOUR_IN_SECONDS ) {
			$m = max( 1, (int) round( $diff / MINUTE_IN_SECONDS ) );
			return 1 === $m ? '1 minute ago' : "{$m} minutes ago";
		}
		if ( $diff < DAY_IN_SECONDS ) {
			$h = (int) round( $diff / HOUR_IN_SECONDS );
			return 1 === $h ? '1 hour ago' : "{$h} hours ago";
		}
		$d = (int) round( $diff / DAY_IN_SECONDS );
		return 1 === $d ? '1 day ago' : "{$d} days ago";
	}

	private static function time_ago_he( $diff ) {
		if ( $diff < 30 ) {
			return 'ממש עכשיו';
		}
		if ( $diff < HOUR_IN_SECONDS ) {
			$m = max( 1, (int) round( $diff / MINUTE_IN_SECONDS ) );
			if ( 1 === $m ) {
				return 'לפני דקה';
			}
			if ( 2 === $m ) {
				return 'לפני שתי דקות';
			}
			return "לפני {$m} דקות";
		}
		if ( $diff < DAY_IN_SECONDS ) {
			$h = (int) round( $diff / HOUR_IN_SECONDS );
			if ( 1 === $h ) {
				return 'לפני שעה';
			}
			if ( 2 === $h ) {
				return 'לפני שעתיים';
			}
			return "לפני {$h} שעות";
		}
		$d = (int) round( $diff / DAY_IN_SECONDS );
		if ( 1 === $d ) {
			return 'לפני יום';
		}
		if ( 2 === $d ) {
			return 'לפני יומיים';
		}
		return "לפני {$d} ימים";
	}
}
