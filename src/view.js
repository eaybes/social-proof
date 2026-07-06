document.addEventListener( 'DOMContentLoaded', () => {
	document
		.querySelectorAll( '.wp-block-social-proof-signature' )
		.forEach( ( block ) => {
			const items = block.querySelectorAll( '.social-proof__item' );

			if ( items.length < 2 ) {
				return;
			}

			const interval = parseInt( block.dataset.rotateInterval, 10 ) || 1500;
			let index = 0;

			setInterval( () => {
				items[ index ].classList.remove( 'is-active' );
				index = ( index + 1 ) % items.length;
				items[ index ].classList.add( 'is-active' );
			}, interval );
		} );
} );
