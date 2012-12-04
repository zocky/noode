# Edited for Debian GNU/Linux
DESTDIR =

NAME    = noode
VERSION = 0.1
PROGS   = bin/noode
BIN     = $(DESTDIR)/usr/bin
SHARE   = $(DESTDIR)/usr/share/noode

build:

install: build
	@echo "Installing in ${DESTDIR}"
	install -d $(BIN)
	install $(PROGS) $(BIN)
	install -d $(SHARE)
	install index.js $(SHARE)

# meta stuff

package: tarball
	debuild -us -uc

clean:
	find . -name '*~' | xargs rm -f 
	rm -f make.log

tarball: clean
	cd .. ; tar czvf $(NAME)_$(VERSION).orig.tar.gz --exclude=.git $(NAME)-$(VERSION) >> /dev/null


