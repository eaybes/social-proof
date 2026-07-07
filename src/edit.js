import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	ColorPalette,
	GradientPicker as StableGradientPicker,
	__experimentalGradientPicker as ExperimentalGradientPicker,
	ToggleGroupControl as StableToggleGroupControl,
	__experimentalToggleGroupControl as ExperimentalToggleGroupControl,
	ToggleGroupControlOption as StableToggleGroupControlOption,
	__experimentalToggleGroupControlOption as ExperimentalToggleGroupControlOption,
	Placeholder,
	Notice,
	Spinner,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

// Older Gutenberg bundles (e.g. the greenpeace.org/israel dev site) only expose
// these as __experimental*; newer ones expose the stable name. Support both.
const ToggleGroupControl = StableToggleGroupControl || ExperimentalToggleGroupControl;
const ToggleGroupControlOption = StableToggleGroupControlOption || ExperimentalToggleGroupControlOption;
const GradientPicker = StableGradientPicker || ExperimentalGradientPicker;

const DEFAULT_TEMPLATES = {
	he: '{name} חתם/ה על העצומה {time_ago}',
	en: '{name} signed the petition {time_ago}',
};

const GRADIENT_PRESETS = [
	{ name: __( 'ירוק־כחול', 'social-proof' ), gradient: 'linear-gradient(135deg,#1d9e75 0%,#0693e3 100%)', slug: 'green-blue' },
	{ name: __( 'שקיעה', 'social-proof' ), gradient: 'linear-gradient(135deg,#fcb900 0%,#ff6900 100%)', slug: 'sunset' },
	{ name: __( 'אפור עדין', 'social-proof' ), gradient: 'linear-gradient(135deg,#f1efe8 0%,#d3d1c7 100%)', slug: 'soft-gray' },
];

function getPillStyle( attributes ) {
	const { textColor, backgroundType, backgroundColor, backgroundGradient } = attributes;
	const background = 'gradient' === backgroundType && backgroundGradient ? backgroundGradient : backgroundColor;
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
		backgroundGradient,
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
					<ToggleGroupControl
						label={ __( 'שפה', 'social-proof' ) }
						value={ language }
						isBlock
						onChange={ ( value ) => {
							const nextAttributes = { language: value };
							if ( ! template || template === DEFAULT_TEMPLATES[ language ] ) {
								nextAttributes.template = DEFAULT_TEMPLATES[ value ];
							}
							setAttributes( nextAttributes );
						} }
					>
						<ToggleGroupControlOption value="he" label={ __( 'עברית', 'social-proof' ) } />
						<ToggleGroupControlOption value="en" label={ __( 'English', 'social-proof' ) } />
					</ToggleGroupControl>
					<ToggleGroupControl
						label={ __( 'יישור הבלוק', 'social-proof' ) }
						value={ align }
						isBlock
						onChange={ ( value ) => setAttributes( { align: value } ) }
					>
						<ToggleGroupControlOption value="right" label={ __( 'ימין', 'social-proof' ) } />
						<ToggleGroupControlOption value="center" label={ __( 'מרכז', 'social-proof' ) } />
						<ToggleGroupControlOption value="left" label={ __( 'שמאל', 'social-proof' ) } />
					</ToggleGroupControl>
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
					<ToggleGroupControl
						label={ __( 'רקע', 'social-proof' ) }
						value={ backgroundType }
						isBlock
						onChange={ ( value ) => setAttributes( { backgroundType: value } ) }
					>
						<ToggleGroupControlOption value="solid" label={ __( 'אחיד', 'social-proof' ) } />
						<ToggleGroupControlOption value="gradient" label={ __( 'מעבר גוונים', 'social-proof' ) } />
					</ToggleGroupControl>
					{ 'gradient' === backgroundType ? (
						<GradientPicker
							value={ backgroundGradient }
							onChange={ ( value ) => setAttributes( { backgroundGradient: value || '' } ) }
							gradients={ GRADIENT_PRESETS }
						/>
					) : (
						<ColorPalette
							value={ backgroundColor }
							onChange={ ( value ) => setAttributes( { backgroundColor: value || '' } ) }
						/>
					) }
				</PanelBody>
				<PanelBody title={ __( 'אנימציה', 'social-proof' ) } initialOpen={ false }>
					<ToggleGroupControl
						label={ __( 'סגנון מעבר בין שמות', 'social-proof' ) }
						value={ animationStyle }
						isBlock
						onChange={ ( value ) => setAttributes( { animationStyle: value } ) }
					>
						<ToggleGroupControlOption value="fade" label={ __( 'עמעום', 'social-proof' ) } />
						<ToggleGroupControlOption value="slide" label={ __( 'החלקה', 'social-proof' ) } />
						<ToggleGroupControlOption value="float" label={ __( 'ריחוף', 'social-proof' ) } />
					</ToggleGroupControl>
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
