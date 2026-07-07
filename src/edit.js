import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	RangeControl,
	ColorPalette,
	Placeholder,
	Notice,
	Spinner,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const DEFAULT_TEMPLATES = {
	he: '{name} חתם/ה על העצומה {time_ago}',
	en: '{name} signed the petition {time_ago}',
};

// Built by hand from two colors + an angle instead of using GradientPicker —
// that component crashed ("Cannot read properties of undefined (reading
// 'orientation')") on the greenpeace.org/israel dev site's older Gutenberg
// bundle. The same crash kept happening after removing it, which pointed to
// ToggleGroupControl itself (also built on a composite/orientation pattern
// internally) — so this block avoids it entirely and uses plain SelectControl
// everywhere instead. Both ColorPalette and RangeControl are much older,
// simpler APIs with no such history there.
function getGradient( attributes ) {
	const { gradientColor1, gradientColor2, gradientAngle } = attributes;
	return `linear-gradient(${ gradientAngle }deg, ${ gradientColor1 } 0%, ${ gradientColor2 } 100%)`;
}

function getPillStyle( attributes ) {
	const { textColor, backgroundType, backgroundColor } = attributes;
	const background = 'gradient' === backgroundType ? getGradient( attributes ) : backgroundColor;
	const style = {};
	if ( textColor ) {
		style.color = textColor;
	}
	if ( background ) {
		style.background = background;
	}
	return style;
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		formId,
		template,
		language,
		align,
		textColor,
		backgroundType,
		backgroundColor,
		gradientColor1,
		gradientColor2,
		gradientAngle,
		animationStyle,
		fixedTimestamps,
	} = attributes;
	const [ forms, setForms ] = useState( [] );
	const [ gfActive, setGfActive ] = useState( true );
	const [ loadingForms, setLoadingForms ] = useState( true );
	const [ preview, setPreview ] = useState( [] );
	const [ loadingPreview, setLoadingPreview ] = useState( false );

	useEffect( () => {
		apiFetch( { path: '/social-proof/v1/forms' } )
			.then( ( res ) => {
				setGfActive( res.active );
				setForms( res.forms || [] );
			} )
			.catch( () => setGfActive( false ) )
			.finally( () => setLoadingForms( false ) );
	}, [] );

	useEffect( () => {
		if ( ! formId ) {
			setPreview( [] );
			return;
		}

		setLoadingPreview( true );

		apiFetch( {
			path: addQueryArgs( '/social-proof/v1/preview', {
				formId,
				language,
				template: template || DEFAULT_TEMPLATES[ language ],
				fixedTimestamps,
			} ),
		} )
			.then( ( res ) => setPreview( res.items || [] ) )
			.catch( () => setPreview( [] ) )
			.finally( () => setLoadingPreview( false ) );
	}, [ formId, template, language, fixedTimestamps ] );

	const blockProps = useBlockProps( {
		className: `social-proof-align-${ align }`,
		dir: 'he' === language ? 'rtl' : 'ltr',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'הגדרות Social Proof', 'social-proof' ) }>
					{ ! loadingForms && ! gfActive && (
						<Notice status="error" isDismissible={ false }>
							{ __(
								'Gravity Forms אינו פעיל באתר זה. יש להתקין ולהפעיל אותו כדי שהבלוק יציג חתימות.',
								'social-proof'
							) }
						</Notice>
					) }
					<SelectControl
						label={ __( 'טופס', 'social-proof' ) }
						value={ formId }
						options={ [
							{ label: __( '— בחר/י טופס —', 'social-proof' ), value: 0 },
							...forms.map( ( form ) => ( {
								label: form.title,
								value: form.id,
							} ) ),
						] }
						onChange={ ( value ) =>
							setAttributes( { formId: Number( value ) } )
						}
						disabled={ loadingForms }
					/>
					<SelectControl
						label={ __( 'שפה', 'social-proof' ) }
						value={ language }
						options={ [
							{ label: __( 'עברית', 'social-proof' ), value: 'he' },
							{ label: __( 'English', 'social-proof' ), value: 'en' },
						] }
						onChange={ ( value ) => {
							const nextAttributes = { language: value };
							if ( ! template || template === DEFAULT_TEMPLATES[ language ] ) {
								nextAttributes.template = DEFAULT_TEMPLATES[ value ];
							}
							setAttributes( nextAttributes );
						} }
					/>
					<SelectControl
						label={ __( 'יישור הבלוק', 'social-proof' ) }
						value={ align }
						options={ [
							{ label: __( 'ימין', 'social-proof' ), value: 'right' },
							{ label: __( 'מרכז', 'social-proof' ), value: 'center' },
							{ label: __( 'שמאל', 'social-proof' ), value: 'left' },
						] }
						onChange={ ( value ) => setAttributes( { align: value } ) }
					/>
					<TextControl
						label={ __( 'טקסט', 'social-proof' ) }
						help={ __( 'ניתן להשתמש בתגיות {name} ו-{time_ago}', 'social-proof' ) }
						value={ template || DEFAULT_TEMPLATES[ language ] }
						onChange={ ( value ) => setAttributes( { template: value } ) }
					/>
					<ToggleControl
						label={ __( 'הסתר את זמן החתימה האמיתי', 'social-proof' ) }
						help={ __( 'יוצגו זמנים קבועים במקום הזמן האמיתי: לפני דקה, לפני 3 דקות, לפני 10 דקות', 'social-proof' ) }
						checked={ !! fixedTimestamps }
						onChange={ ( value ) => setAttributes( { fixedTimestamps: value } ) }
					/>
				</PanelBody>
				<PanelBody title={ __( 'צבעים', 'social-proof' ) } initialOpen={ false }>
					<p>{ __( 'צבע טקסט', 'social-proof' ) }</p>
					<ColorPalette
						value={ textColor }
						onChange={ ( value ) => setAttributes( { textColor: value || '' } ) }
					/>
					<SelectControl
						label={ __( 'רקע', 'social-proof' ) }
						value={ backgroundType }
						options={ [
							{ label: __( 'אחיד', 'social-proof' ), value: 'solid' },
							{ label: __( 'מעבר גוונים', 'social-proof' ), value: 'gradient' },
						] }
						onChange={ ( value ) => setAttributes( { backgroundType: value } ) }
					/>
					{ 'gradient' === backgroundType ? (
						<>
							<p>{ __( 'צבע התחלה', 'social-proof' ) }</p>
							<ColorPalette
								value={ gradientColor1 }
								onChange={ ( value ) => setAttributes( { gradientColor1: value || '#1d9e75' } ) }
							/>
							<p>{ __( 'צבע סיום', 'social-proof' ) }</p>
							<ColorPalette
								value={ gradientColor2 }
								onChange={ ( value ) => setAttributes( { gradientColor2: value || '#0693e3' } ) }
							/>
							<RangeControl
								label={ __( 'זווית מעבר הגוונים', 'social-proof' ) }
								value={ gradientAngle }
								onChange={ ( value ) => setAttributes( { gradientAngle: value ?? 135 } ) }
								min={ 0 }
								max={ 360 }
							/>
						</>
					) : (
						<ColorPalette
							value={ backgroundColor }
							onChange={ ( value ) => setAttributes( { backgroundColor: value || '' } ) }
						/>
					) }
				</PanelBody>
				<PanelBody title={ __( 'אנימציה', 'social-proof' ) } initialOpen={ false }>
					<SelectControl
						label={ __( 'סגנון מעבר בין שמות', 'social-proof' ) }
						value={ animationStyle }
						options={ [
							{ label: __( 'עמעום', 'social-proof' ), value: 'fade' },
							{ label: __( 'החלקה', 'social-proof' ), value: 'slide' },
							{ label: __( 'ריחוף', 'social-proof' ), value: 'float' },
						] }
						onChange={ ( value ) => setAttributes( { animationStyle: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ ! formId && (
					<Placeholder
						icon="groups"
						label={ __( 'Social Proof', 'social-proof' ) }
						instructions={ __(
							'בחר/י טופס Gravity Forms מהגדרות הבלוק כדי להציג את החתימות האחרונות.',
							'social-proof'
						) }
					/>
				) }
				{ formId && loadingPreview && <Spinner /> }
				{ formId && ! loadingPreview && 0 === preview.length && (
					<p>{ __( 'אין עדיין חתימות להצגה עבור טופס זה.', 'social-proof' ) }</p>
				) }
				{ formId && ! loadingPreview && preview.length > 0 && (
					<div
						className="social-proof__viewport"
						data-animation={ animationStyle }
						style={ getPillStyle( attributes ) }
					>
						{ preview.map( ( text, index ) => (
							<span
								key={ index }
								className={ `social-proof__item${ 0 === index ? ' is-active' : '' }` }
							>
								{ text }
							</span>
						) ) }
					</div>
				) }
			</div>
		</>
	);
}
