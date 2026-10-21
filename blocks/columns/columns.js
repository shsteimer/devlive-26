export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      if (col.children.length === 1 && col.querySelector('picture, img')) {
        col.classList.add('columns-img-col');
      }
    });
  });
}
